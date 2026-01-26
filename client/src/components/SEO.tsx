import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title: string;
    description?: string;
    type?: string;
}

export default function SEO({ title, description, type = 'website' }: SEOProps) {
    const siteTitle = 'UniRent';
    const metaDescription = description || 'UniRent - Campus Skill Marketplace for lending and borrowing skills.';

    return (
        <Helmet>
            <title>{`${title} | ${siteTitle}`}</title>
            <meta name="description" content={metaDescription} />
            <meta property="og:type" content={type} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={metaDescription} />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={metaDescription} />
        </Helmet>
    );
}
