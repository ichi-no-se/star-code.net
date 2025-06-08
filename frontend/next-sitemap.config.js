const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
if (!siteUrl) {
	throw new Error("NEXT_PUBLIC_SITE_URL is not defined in the environment variables.");
}

module.exports = {
	siteUrl: siteUrl,
	generateRobotsTxt: true,
	robotsTxtOptions: {
		policies: [
			{
				userAgent: "*",
				allow: "/",
				disallow: ["/downloads", "/socket.io"],
			}
		],
	}
}
