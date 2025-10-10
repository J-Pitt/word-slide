# WordSlide Setup Guide

This guide will help you set up the WordSlide game project for development.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd wordslide
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env.local
# Edit .env.local with your configuration
```

## Development

1. Start the development server:
```bash
npm run dev
```

2. Run tests:
```bash
npm test
```

3. Build for production:
```bash
npm run build
```

## Project Structure

```
src/
├── components/     # React components
├── contexts/       # React contexts
├── utils/          # Utility functions
├── test/           # Test files
└── main.jsx        # Entry point

lambda/             # AWS Lambda functions
aws-infrastructure/ # AWS deployment files
docs/               # Documentation
```

## Testing

The project uses Vitest for testing:

- Unit tests: `src/utils/*.test.js`
- Component tests: `src/components/*.test.jsx`
- Integration tests: `src/test/integration/`
- Mobile tests: `src/test/mobile/`

Run tests with:
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
npm run test:ui       # UI test runner
```

## Deployment

See `AWS-DEPLOYMENT.md` for deployment instructions.

## Contributing

1. Follow the development workflow in `DEVELOPMENT-WORKFLOW.md`
2. Write tests for new features
3. Ensure all tests pass before submitting PR
4. Follow the coding standards in the project
