# WordSlide - React Puzzle Game

A beautiful sliding tile puzzle game built with React, featuring a wooden board design and 3D block tiles. The goal is to slide tiles to form the target words: **FIVE**, **RICE**, and **BIRD**.

## 🎮 Game Features

- **Wooden Board Design**: Authentic wooden appearance with grain patterns
- **3D Block Tiles**: Raised tiles with realistic shadows and highlights
- **Mobile Optimized**: Touch-friendly controls and responsive design
- **Smooth Animations**: Fluid tile sliding with 3D effects
- **Solvable Puzzles**: All puzzles can be solved within 8 moves
- **Win/Lose Conditions**: Clear feedback when you solve or run out of moves

## 🚀 Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. **Clone or download the project**
2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

## 🎯 How to Play

1. **Objective**: Slide tiles to form the words **FIVE**, **RICE**, and **BIRD** in the first three rows
2. **Controls**: Click or tap tiles adjacent to the empty space to slide them
3. **Move Limit**: You have 8 moves to solve the puzzle
4. **Win**: Form all three target words correctly
5. **Reset**: Use the "New Game" button to start over anytime

## 🛠️ Technology Stack

- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Canvas API** - Custom rendering for wooden board and 3D tiles
- **CSS3** - Responsive design and animations

## 📱 Mobile Optimization

- Touch-friendly controls
- Responsive design that adapts to screen size
- Optimized for mobile performance
- Prevents text selection and zoom on mobile

## 🎨 Design Features

- **Wooden Board**: Realistic wood grain and texture
- **3D Tiles**: Raised blocks with proper perspective
- **Smooth Animations**: 60fps tile sliding
- **Professional UI**: Wooden-themed buttons and styling
- **Visual Feedback**: Clear win/lose states

## 🧩 Puzzle Design

The game includes multiple puzzle patterns that are:
- **Solvable**: All puzzles can be completed
- **Challenging**: Require strategic thinking
- **Balanced**: Not too easy, not too hard
- **Varied**: Different patterns for replayability

## 📁 Project Structure

```
src/
├── components/
│   ├── GameBoard.jsx    # Canvas rendering and tile interactions
│   └── GameInfo.jsx     # Game instructions and move counter
├── App.jsx              # Main game logic and state management
├── main.jsx             # React entry point
└── styles.css           # Styling and responsive design
```

## 📚 Documentation

All project documentation has been organized in the `docs/` folder:

- **[Setup Guide](docs/SETUP.md)** - Project setup and installation
- **[Development Workflow](docs/DEVELOPMENT-WORKFLOW.md)** - Development best practices
- **[Testing Guide](docs/TESTING.md)** - Testing setup and guidelines
- **[AWS Deployment](docs/AWS-DEPLOYMENT.md)** - AWS deployment instructions
- **[Database Setup](docs/aws-infrastructure/DATABASE-SETUP.md)** - Database configuration

## 🎯 Current Features

- ✅ **Three Difficulty Levels** - Easy, Medium, Hard with different blocked cell patterns
- ✅ **User Authentication** - Login/register system with JWT tokens
- ✅ **Game Statistics** - Track progress, moves, and scores
- ✅ **Leaderboards** - Separate leaderboards for each difficulty level
- ✅ **Game Completion** - Permanent completion tracking and stats reset
- ✅ **Mobile Optimization** - Safe area support for iPhone 15 Pro and other devices
- ✅ **Comprehensive Testing** - 127+ tests covering all functionality

## 🚀 Quick Commands

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build

# Testing
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
npm run test:ui          # Interactive UI

# Deployment
npm run pre-deploy       # Run tests + build
```

## 📄 License

MIT License - feel free to use and modify as needed!

---

Enjoy playing WordSlide! 🎮✨