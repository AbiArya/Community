import { defineConfig } from "cypress";

export default defineConfig({
	e2e: {
		baseUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
		supportFile: "cypress/support/e2e.ts",
		specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
		video: false,
		screenshotOnRunFailure: true,
	},
});


