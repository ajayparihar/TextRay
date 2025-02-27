# TextRay

A modern text comparison tool that helps you analyze and compare text in real-time. Built with React, TypeScript, and Material-UI.

## Features

- Real-time word comparison between two paragraphs
- Highlights common words with a contrasting color
- Dark theme UI
- Ignores common stop words (e.g., "the", "and", "in", etc.)
- Case-insensitive comparison

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository
2. Navigate to the project directory
3. Install dependencies:
```bash
npm install
```

### Development

To start the development server:
```bash
npm run dev
```

### Testing

To run the tests:
```bash
npm test
```

### Building for Production

To create a production build:
```bash
npm run build
```

## Usage

1. Enter text in either of the two text areas
2. Common words (excluding stop words) will be automatically highlighted in both paragraphs
3. The comparison is case-insensitive and updates in real-time

## Technologies Used

- React
- TypeScript
- Material-UI
- Vite
- Vitest (Testing) 