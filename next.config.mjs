/** @type {import('next').NextConfig} */
const nextConfig = {
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block',
                    },
                    {
                        key: 'Content-Security-Policy',
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com",
                            "connect-src 'self' https://rxsbrpyalenhdkakgfmg.supabase.co https://api.stripe.com https://www.google-analytics.com",
                            "img-src 'self' data: https:",
                            "style-src 'self' 'unsafe-inline'"
                        ].join('; '),
                    },
                ],
            },
        ];
    },
};

export default nextConfig;