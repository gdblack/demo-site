import PageContent from "@/lib/shared/PageContent";
import fetchContentType from "@/lib/strapi/fetchContentType";
import Image from "next/image";

export default async function Home() {

  const pageData = await fetchContentType(
    'pages',
    {
      filters: {
        slug: 'homepage',
      },
    },
    true
  );

  console.log('pageData', pageData);
  return (
    <>
      <PageContent pageData={pageData} />
    </>
  );
}
