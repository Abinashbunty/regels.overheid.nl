import { getPageBySlug } from '@/services/cms/get-page-by-slug';
import { MDXRemote } from 'next-mdx-remote/rsc';
import Head from 'next/head';
import { Metadata } from 'next';
import remarkGfmPlugin from 'remark-gfm';
import { Container } from '@/components/container';

interface Props {
  params?: {
    slug: string;
  };
}

export default async function Home({ params }: Props) {
  const page = await getPageBySlug(params?.slug || 'home');

  return (
    <>
      <Head>
        <title>{`Regelregister van de Nederlandse Overheid - ${page.data?.attributes.name}`}</title>
      </Head>
      <Container className="prose">
        {/* @ts-expect-error Server Component */}
        <MDXRemote
          source={page.data?.attributes.content}
          options={{ mdxOptions: { rehypePlugins: [remarkGfmPlugin] } }}
        />
      </Container>
    </>
  );
}

export const metadata: Metadata = {
  title: 'Regelregister van de Nederlandse Overheid',
};
