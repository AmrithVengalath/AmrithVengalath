<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/banner-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="assets/banner-light.svg">
  <img alt="Amrith Vengalath, Senior Software Engineer, React Native, Flutter, Next.js" src="assets/banner-dark.svg" width="880">
</picture>

<br>

[![website](https://img.shields.io/badge/vengalath.com-22d3ee?style=flat-square&logo=firefoxbrowser&logoColor=0a0d16&labelColor=0e1220)](https://vengalath.com)
[![blog](https://img.shields.io/badge/blog-a78bfa?style=flat-square&logo=rss&logoColor=0a0d16&labelColor=0e1220)](https://vengalath.com/blog/)
[![linkedin](https://img.shields.io/badge/linkedin-8b93ab?style=flat-square&logo=linkedin&logoColor=0a0d16&labelColor=0e1220)](https://www.linkedin.com/in/AmrithVengalath)
[![x](https://img.shields.io/badge/@AmrithVengalath-8b93ab?style=flat-square&logo=x&logoColor=0a0d16&labelColor=0e1220)](https://twitter.com/AmrithVengalath)
[![orcid](https://img.shields.io/badge/orcid-8b93ab?style=flat-square&logo=orcid&logoColor=0a0d16&labelColor=0e1220)](https://orcid.org/0009-0002-6982-8415)
[![email](https://img.shields.io/badge/amrith@vengalath.com-8b93ab?style=flat-square&logo=maildotru&logoColor=0a0d16&labelColor=0e1220)](mailto:amrith@vengalath.com)

</div>

I build the guardrails that keep React Native releases from breaking.

Senior Software Engineer at [Zerone Consulting](https://www.zerone-consulting.com/), Kerala, India. Seven years shipping cross platform apps, most recently leading a React Native `0.73` to `0.82` New Architecture migration. The three tools below came out of that work: each one closes a gap where a mobile release usually goes wrong.

<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/stats-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="assets/stats-light.svg">
  <img alt="Open source: npm downloads per month across three packages" src="assets/stats-dark.svg" width="420">
</picture>
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/activity-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="assets/activity-light.svg">
  <img alt="Contribution activity over the last twelve months" src="assets/activity-dark.svg" width="420">
</picture>

</div>

## The React Native release pipeline

Three published packages, one per stage. All MIT, all in production use.

<!--START:tools-->
#### Pre merge &nbsp;·&nbsp; [`react-native-doctor-ci`](https://github.com/AmrithVengalath/react-native-doctor-ci)

[![npm](https://img.shields.io/npm/v/react-native-doctor-ci?style=flat-square&color=22d3ee&labelColor=0e1220&logo=npm&logoColor=22d3ee)](https://www.npmjs.com/package/react-native-doctor-ci) [![downloads](https://img.shields.io/npm/dm/react-native-doctor-ci?style=flat-square&color=a78bfa&labelColor=0e1220&label=downloads)](https://www.npmjs.com/package/react-native-doctor-ci) [![stars](https://img.shields.io/github/stars/AmrithVengalath/react-native-doctor-ci?style=flat-square&color=8b93ab&labelColor=0e1220)](https://github.com/AmrithVengalath/react-native-doctor-ci) [![license](https://img.shields.io/badge/license-MIT-8b93ab?style=flat-square&labelColor=0e1220)](https://github.com/AmrithVengalath/react-native-doctor-ci/blob/main/LICENSE)

Policy as code CI gate for React Native dependency health. Fails the pull request and annotates the exact `package.json` lines that add an abandoned, non New Architecture, or npm deprecated dependency. Also ships as a GitHub Action. Emits SARIF.

#### Pre release &nbsp;·&nbsp; [`react-native-deeplink-devtools`](https://github.com/deeplink-devtools/react-native-deeplink-devtools)

[![npm](https://img.shields.io/npm/v/react-native-deeplink-devtools?style=flat-square&color=22d3ee&labelColor=0e1220&logo=npm&logoColor=22d3ee)](https://www.npmjs.com/package/react-native-deeplink-devtools) [![downloads](https://img.shields.io/npm/dm/react-native-deeplink-devtools?style=flat-square&color=a78bfa&labelColor=0e1220&label=downloads)](https://www.npmjs.com/package/react-native-deeplink-devtools) [![stars](https://img.shields.io/github/stars/deeplink-devtools/react-native-deeplink-devtools?style=flat-square&color=8b93ab&labelColor=0e1220)](https://github.com/deeplink-devtools/react-native-deeplink-devtools) [![license](https://img.shields.io/badge/license-MIT-8b93ab?style=flat-square&labelColor=0e1220)](https://github.com/deeplink-devtools/react-native-deeplink-devtools/blob/main/LICENSE)

The `rndl` CLI for React Native deep links. Inspects route tables, validates AASA and Android App Links, opens links on simulators and devices, and generates type safe link helpers. Runs locally or in CI.

#### Post release &nbsp;·&nbsp; [`react-native-release-health`](https://github.com/release-health/react-native-release-health)

[![npm](https://img.shields.io/npm/v/react-native-release-health?style=flat-square&color=22d3ee&labelColor=0e1220&logo=npm&logoColor=22d3ee)](https://www.npmjs.com/package/react-native-release-health) [![downloads](https://img.shields.io/npm/dm/react-native-release-health?style=flat-square&color=a78bfa&labelColor=0e1220&label=downloads)](https://www.npmjs.com/package/react-native-release-health) [![stars](https://img.shields.io/github/stars/release-health/react-native-release-health?style=flat-square&color=8b93ab&labelColor=0e1220)](https://github.com/release-health/react-native-release-health) [![license](https://img.shields.io/badge/license-MIT-8b93ab?style=flat-square&labelColor=0e1220)](https://github.com/release-health/react-native-release-health/blob/main/LICENSE)

Vendor neutral OTA rollout safety. Session tagging, update probation, crash loop detection, and rollback recommendations, so a bad over the air update is caught on device instead of in your reviews. Works with `expo-updates` and `hot-updater`.

<!--END:tools-->

## Stack

<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/stack-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="assets/stack-light.svg">
  <img alt="TypeScript, JavaScript, React, Flutter, Dart, Expo, Swift, Kotlin, Android, Apple, Xcode, GitHub Actions, Fastlane, App Store, Google Play, Sentry, Firebase, Redux, Next.js, Angular, Node.js, Tailwind CSS, Python, MySQL, Git, Jira, Cloudflare, Claude" src="assets/stack-dark.svg" width="880">
</picture>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/highlights-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="assets/highlights-light.svg">
  <img alt="Highlights: GitHub achievements, published packages, posts, years on GitHub" src="assets/highlights-dark.svg" width="880">
</picture>

</div>

## Writing

<!--START:posts-->
| | |
| --- | --- |
| Jul 26, 2026 | [react-native-release-health: catching a bad OTA update before your users do](https://vengalath.com/blog/react-native-release-health-ota-rollout-safety/) |
| Jul 13, 2026 | [We ran rn-doctor on 20 popular React Native templates - here's what's dying inside them](https://vengalath.com/blog/we-ran-rn-doctor-on-20-popular-react-native-templates/) |
| Jul 12, 2026 | [Why universal links and Android App Links break (10 fixes)](https://vengalath.com/blog/why-universal-links-and-android-app-links-break/) |
| Apr 21, 2026 | [Seven years shipping cross-platform apps: what I actually learned](https://vengalath.com/blog/seven-years-shipping-cross-platform-apps-release-engineering-lessons/) |

<sub>46 posts and counting at [vengalath.com/blog](https://vengalath.com/blog/) · [RSS](https://vengalath.com/feed.xml)</sub>
<!--END:posts-->

## Track record

- Led a React Native `0.73` to `0.82` migration across nine versions, enabling the New Architecture with validated post migration stability.
- Cut crash rates and load times by 40% through targeted profiling and optimization across a wide range of devices.
- Automated builds, tests, and store deployments with Fastlane and GitHub Actions.
- Shipped same day hotfixes with CodePush OTA updates, with Sentry and Firebase Crashlytics reporting from production.
- Built gesture driven animations with Reanimated and custom native modules bridging iOS and Android.

<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/AmrithVengalath/AmrithVengalath/output/snake-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/AmrithVengalath/AmrithVengalath/output/snake.svg">
  <img alt="A snake eating my contribution graph" src="https://raw.githubusercontent.com/AmrithVengalath/AmrithVengalath/output/snake-dark.svg" width="880">
</picture>

<br><br>

<sub>

[vengalath.com](https://vengalath.com) · [blog](https://vengalath.com/blog/) · [rss](https://vengalath.com/feed.xml) · [pgp](https://vengalath.com/gpg) · [amrith@vengalath.com](mailto:amrith@vengalath.com)

</sub>

![profile views](https://komarev.com/ghpvc/?username=AmrithVengalath&style=flat-square&color=22d3ee&labelColor=0e1220&label=profile+views)
[![built with](https://img.shields.io/badge/built%20with-%E2%99%A5-a78bfa?style=flat-square&labelColor=0e1220)](https://github.com/AmrithVengalath/AmrithVengalath/blob/main/scripts/refresh.mjs)

<sub>Every card and the post list regenerate daily from npm, the GitHub API, and my RSS feed. No numbers on this page are typed by hand. See <a href="scripts/refresh.mjs">scripts/refresh.mjs</a>.</sub>

</div>
