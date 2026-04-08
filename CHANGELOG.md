# Changelog

## [2026-04-08] - UI Bug Fixes - Fixed a broken SVG image issue in the sidebar fallback logo by disabling Next.js image optimization for Dicebear generated SVGs. Resolved a React hydration error caused by invalid HTML nesting (`<td>` inside `<div>`) within data table skeletons.
## [2026-04-08] - Hide Organization Name - Removed organization name text from sidebar header, keeping only the logo/avatar visible.
## [2026-04-08] - Nationality Dropdown Fix - Fixed nationality dropdown not showing all countries by switching from GraphQL (limited to 30 rows) to Supabase REST API for a single-request fetch of all 238 countries.
## [2026-04-08] - Sign Up Link Update - Updated the "Sign up" link on the login page from `studyinturkiye.com` to `sayainternational.com/became-an-agent/` to reflect the new production domain.
## [2026-04-08] - Commission Text Update - Changed "Final Commission" to "Average Commission" on the program detail page and updated formatting to hide trailing zeros (e.g., 1,000 USD).
