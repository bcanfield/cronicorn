module.exports = {
	branches: ["main"],
	plugins: [
		// 1. Figure out next version
		["@semantic-release/commit-analyzer", { preset: "conventionalcommits" }],
		"@semantic-release/release-notes-generator",

		// 2. Generate or update CHANGELOG.md
		["@semantic-release/changelog", { changelogFile: "CHANGELOG.md" }],

		// 3. Bump version in root + all workspaces
		[
			"@semantic-release/exec",
			{
				prepareCmd: "pnpm -r version ${nextRelease.version} --no-git-tag-version",
			},
		],

		// 4. Commit all changed package.jsons + CHANGELOG.md
		[
			"@semantic-release/git",
			{
				assets: ["package.json", "packages/*/package.json", "CHANGELOG.md"],
				message: "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
			},
		],

		// 5. Skip the built-in npm publish
		["@semantic-release/npm", { npmPublish: false }],

		// 6. Publish only your SDK via pnpm
		[
			"@semantic-release/exec",
			{
				publishCmd: "pnpm --filter @your-scope/my-sdk publish --access public",
			},
		],

		// 7. Create a GitHub Release
		"@semantic-release/github",
	],
};
