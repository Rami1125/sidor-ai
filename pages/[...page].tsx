// pages/[...page].tsx
import { BuilderComponent, builder } from '@builder.io/react';

builder.init(process.env.NEXT_PUBLIC_BUILDER_API_KEY!);

export async function getStaticProps({ params }) {
  const page = await builder.get('page', {
    userAttributes: { urlPath: '/' + (params?.page?.join('/') || '') },
  }).toPromise();

  return { props: { page: page || null } };
}

export default function MyPage({ page }) {
  return (
    <AppLayout>
      <BuilderComponent model="page" content={page} />
    </AppLayout>
  );
}
