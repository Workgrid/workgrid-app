# Workgrid App

![](https://img.shields.io/github/license/workgrid/workgrid-ui-components)
![](https://img.shields.io/badge/language-TypeScript-blue)

# Development

The Workgrid application is built on top of the [Capacitor framework](https://capacitorjs.com/) enabling us to deliver the Workgrid experience to iOS, Android, Windows and Mac (via Electron). Please follow the steps below to setup your development environment to be able to develop on all platforms.

This project requires `npm` and does not use `yarn`.

## Setup

1. Install and setup required dependencies as noted in the Capacitor documentation: [Environment Setup](https://capacitorjs.com/docs/v3/getting-started/environment-setup)
2. Obtain the plugin key from a colleague and set it as an environment variable as noted in the AppFlow docs: [Configure Local Development Environment](https://ionic.io/docs/appflow/cookbook/private-native-enterprise-keys#configure-local-development-environment)

## Workflow

See the [Capacitor Workflow](https://capacitorjs.com/docs/v3/basics/workflow) documentation for basic information on the development workflow.

# Development Process

All code intended for production use must:

1. Be introduced as a pull request targeting the `main` branch.
2. All pull requests must have a reference to the internal change management ticket by including it in the pull request title or description (e.g. ETSWORK-####)
3. All code must be approved by at least two reviewers as well as any defined [code owners](https://docs.github.com/en/github/creating-cloning-and-archiving-repositories/about-code-owners) in accordance with our internally documented code review guidelines
   1. At least one code reviewer should determine if the code change matches the intent of the change management ticket.
4. All required checks must pass before a pull request can be merged. These are automated through GitHub Actions. Required build checks include:
   1. All automated unit tests need to pass
   2. All automated integration tests need to pass
   3. A successful distributable (e.g. package, binary) can be built
   4. Code security scanning checks need to pass
