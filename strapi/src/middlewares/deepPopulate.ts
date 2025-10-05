/**
 * Controlled `deepPopulate` middleware with configurable depth limits
 * and safeguards against infinite or excessively deep population.
 */
import type { Core } from '@strapi/strapi';
import { UID } from '@strapi/types';
import { contentTypes } from '@strapi/utils';
import pluralize from 'pluralize';

interface Options {
  /**
   * Fields to select when populating relations
   */
  relationalFields?: string[];
  /**
   * Maximum depth to prevent infinite recursion
   */
  maxDepth?: number;
  /**
   * Current depth level
   */
  currentDepth?: number;
  /**
   * Visited UIDs to prevent circular references
   */
  visitedUIDs?: Set<string>;
  /**
   * Specific depth limits for certain UIDs or paths
   */
  depthLimits?: Record<string, number>;
}

const { CREATED_BY_ATTRIBUTE, UPDATED_BY_ATTRIBUTE } = contentTypes.constants;

// This regex is designed to extract the last path segment from a URL
const extractPathSegment = (url: string) => {
  const path = url.split('?')[0];
  const match = path.match(/^\/api\/([^/?]+)(?:\/|\/\d+)?$/);
  return match ? match[1] : '';
};

// Configuration for specific content types and their population depth
const DEPTH_CONFIG = {
  // Stop at depth 1 for these content types (only populate direct relations)
  shallowPopulate: [
    'api::user.user',
    'api::role.role',
    'api::permission.permission',
  ],
  // Stop at depth 2 for these content types
  mediumPopulate: [
    // 'api::example.example', // Example: populate direct relations but not deeper
  ],
  // Custom depth for specific paths
  pathDepths: {
    // 'shared.component.example': 2, // Example: this component's nested content goes 2 levels deep
    // 'shared.component.example.subfield': 1, // Example: restrict deeper nesting for a specific subfield
  },
  // Fields to exclude when populating certain relations
  excludeFields: {
    // Example: completely exclude a large or sensitive field when nested
    // 'api::large-content.large-content': ['largeField'],

    // Example: avoid populating a two-way relation to prevent excessive nesting
    // 'api::related-item.related-item': ['backlinkRelation'],
  },
  // Alternative: only populate specific fields for certain contexts
  includeOnlyFields: {
    // When populating a relation from within a specific context, only include these fields
    // 'component.relationField': ['id', 'title', 'slug'],
    // 'items.relationField': ['id', 'name'],
  },
};

const getPathKey = (path: string[]): string => {
  return path.join('.');
};

const shouldStopAtCurrentDepth = (
  uid: string,
  currentDepth: number,
  path: string[]
): boolean => {
  // Check path-specific depths first
  const pathKey = getPathKey(path);
  if (DEPTH_CONFIG.pathDepths[pathKey] !== undefined) {
    return currentDepth >= DEPTH_CONFIG.pathDepths[pathKey];
  }

  // Check UID-specific shallow populate
  if (DEPTH_CONFIG.shallowPopulate.includes(uid)) {
    return currentDepth >= 1;
  }

  // Check UID-specific medium populate
  if (DEPTH_CONFIG.mediumPopulate.includes(uid)) {
    return currentDepth >= 2;
  }

  // Default max depth
  return currentDepth >= 3;
};

const getDeepPopulate = (
  uid: UID.Schema,
  opts: Options = {},
  path: string[] = []
): any => {
  // Set default options
  const options = {
    maxDepth: 3, // Default maximum depth
    currentDepth: 0,
    visitedUIDs: new Set<string>(),
    ...opts,
  };

  // Check if we should stop at current depth
  if (shouldStopAtCurrentDepth(uid, options.currentDepth, path)) {
    console.log(
      `Stopping at depth ${options.currentDepth} for UID: ${uid}, path: ${getPathKey(path)}`
    );
    return '*';
  }

  // Prevent circular references
  if (options.visitedUIDs.has(uid) && options.currentDepth > 0) {
    console.log(
      `Circular reference detected for UID: ${uid}, returning simple populate`
    );
    return '*';
  }

  const model = strapi.getModel(uid);
  if (!model) {
    console.log(`Model not found for UID: ${uid}`);
    return '*';
  }

  // Add current UID to visited set
  const newVisitedUIDs = new Set(options.visitedUIDs);
  newVisitedUIDs.add(uid);

  const attributes = Object.entries(model.attributes);
  console.log(
    `Getting deep populate for model: ${uid} at depth ${options.currentDepth}, path: ${getPathKey(path)}`
  );

  return attributes.reduce((acc: any, [attributeName, attribute]) => {
    const currentPath = [...path, attributeName];

    // Check for field exclusions
    if (
      DEPTH_CONFIG.excludeFields[uid] &&
      DEPTH_CONFIG.excludeFields[uid].includes(attributeName)
    ) {
      console.log(
        `Excluding field ${attributeName} from ${uid} based on exclusion rules`
      );
      return acc;
    }

    // Check for include-only fields based on context path
    const contextKey =
      path.length > 0 ? `${path[path.length - 1]}.${attributeName}` : null;
    if (contextKey && DEPTH_CONFIG.includeOnlyFields[contextKey]) {
      // If we have include-only fields defined for this context, use simplified population
      console.log(
        `Using simplified population for ${attributeName} in context ${contextKey}`
      );
      const fieldsToInclude = DEPTH_CONFIG.includeOnlyFields[contextKey];
      acc[attributeName] = {
        populate: fieldsToInclude.reduce((fields: any, field: string) => {
          fields[field] = true;
          return fields;
        }, {}),
      };
      return acc;
    }

    switch (attribute.type) {
      case 'relation': {
        const isMorphRelation = attribute.relation
          .toLowerCase()
          .startsWith('morph');
        if (isMorphRelation) {
          break;
        }

        // Skip created/updated by relations to avoid deep user nesting
        if (
          attributeName === CREATED_BY_ATTRIBUTE ||
          attributeName === UPDATED_BY_ATTRIBUTE
        ) {
          break;
        }

        const isVisible = contentTypes.isVisibleAttribute(model, attributeName);

        if (
          isVisible &&
          (!options.relationalFields ||
            options.relationalFields.includes(attributeName))
        ) {
          console.log(
            `Processing relation: ${attributeName} at path: ${getPathKey(currentPath)}`
          );

          const targetUID = attribute.target;

          // Check if we should use simple populate for this specific relation
          if (
            shouldStopAtCurrentDepth(
              targetUID as string,
              options.currentDepth + 1,
              currentPath
            )
          ) {
            acc[attributeName] = { populate: '*' };
          } else if (targetUID) {
            // Continue with deep populate
            const nestedPopulate = getDeepPopulate(
              targetUID as UID.Schema,
              {
                ...options,
                currentDepth: options.currentDepth + 1,
                visitedUIDs: newVisitedUIDs,
              },
              currentPath
            );

            if (
              typeof nestedPopulate === 'object' &&
              Object.keys(nestedPopulate).length > 0
            ) {
              acc[attributeName] = { populate: nestedPopulate };
            } else {
              acc[attributeName] = { populate: '*' };
            }
          } else {
            acc[attributeName] = { populate: '*' };
          }
        }

        break;
      }

      case 'media': {
        acc[attributeName] = { populate: '*' };
        break;
      }

      case 'component': {
        console.log(
          `Processing component: ${attribute.component} at path: ${getPathKey(currentPath)}`
        );

        const componentPopulate = getDeepPopulate(
          attribute.component as UID.Schema,
          {
            ...options,
            currentDepth: options.currentDepth + 1,
            visitedUIDs: newVisitedUIDs,
          },
          currentPath
        );

        if (
          typeof componentPopulate === 'object' &&
          Object.keys(componentPopulate).length > 0
        ) {
          acc[attributeName] = { populate: componentPopulate };
        } else {
          acc[attributeName] = { populate: '*' };
        }
        break;
      }

      case 'dynamiczone': {
        const populatedComponents = (attribute.components || []).reduce(
          (acc: any, componentUID: UID.Component) => {
            console.log(
              `Processing dynamic zone component: ${componentUID} at path: ${getPathKey(currentPath)}`
            );

            const componentPopulate = getDeepPopulate(
              componentUID,
              {
                ...options,
                currentDepth: options.currentDepth + 1,
                visitedUIDs: newVisitedUIDs,
              },
              [...currentPath, componentUID]
            );

            if (
              typeof componentPopulate === 'object' &&
              Object.keys(componentPopulate).length > 0
            ) {
              acc[componentUID] = { populate: componentPopulate };
            } else {
              acc[componentUID] = { populate: '*' };
            }

            return acc;
          },
          {}
        );

        acc[attributeName] = { on: populatedComponents };
        break;
      }

      default:
        break;
    }

    return acc;
  }, {});
};

export default (config, { strapi }: { strapi: Core.Strapi }) => {
  return async (ctx, next) => {
    if (
      ctx.request.url.startsWith('/api/') &&
      ctx.request.method === 'GET' &&
      !ctx.query.populate &&
      !ctx.request.url.includes('/api/users') &&
      !ctx.request.url.includes('/api/seo')
    ) {
      strapi.log.info('Using controlled deepPopulate middleware...');

      const contentType = extractPathSegment(ctx.request.url);
      if (!contentType) {
        strapi.log.warn(
          'deepPopulate: Could not extract content type from URL.'
        );
        await next();
        return;
      }

      const singular = pluralize.singular(contentType);
      console.log(
        `Extracted content type: ${contentType}, singular: ${singular}`
      );
      if (!singular) {
        strapi.log.warn(
          `deepPopulate: Could not singularize content type "${contentType}".`
        );
        await next();
        return;
      }

      const uid = `api::${singular}.${singular}`;
      try {
        const populateConfig = getDeepPopulate(uid as UID.Schema);

        ctx.query.populate = populateConfig;

        // Log the final populate config for debugging
        strapi.log.info(
          'Final populate config:',
          JSON.stringify(ctx.query.populate, null, 2)
        );
      } catch (error) {
        strapi.log.error(
          `deepPopulate: Failed to get model for UID "${uid}".`,
          error
        );
      }
    }
    await next();
  };
};
