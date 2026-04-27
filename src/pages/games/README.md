# Games Directory

This directory contains all the games for the website. Each game is implemented as an Astro page with React components for interactivity.

## Structure

```
src/pages/games/
├── README.md           # This file
├── index.astro         # Games listing page
└── [game-name].astro   # Individual game pages
```

```
src/components/games/
├── GameOfLife.tsx      # Game of Life React component
└── [GameName].tsx      # Other game components
```

## How to Add a New Game

### 1. Create the React Game Component

Create a new React component in `src/components/games/`:

```tsx
// src/components/games/YourGame.tsx
import React, { useState } from 'react';

interface YourGameProps {
  className?: string;
}

const YourGame: React.FC<YourGameProps> = ({ className = '' }) => {
  const [gameState, setGameState] = useState(/* initial state */);

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* Game controls */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
        <button
          className="px-4 py-2 font-mono bg-black text-white dark:bg-white dark:text-black hover:bg-black/80 dark:hover:bg-white/80 transition-colors"
          onClick={/* your handler */}
        >
          Action
        </button>
      </div>

      {/* Game board/area */}
      <div className="border-2 border-black/15 dark:border-white/15 bg-white dark:bg-stone-900">
        {/* Your game UI */}
      </div>

      {/* Instructions */}
      <div className="text-xs font-mono text-black/60 dark:text-white/60 text-center max-w-md">
        <p>Game instructions here</p>
      </div>
    </div>
  );
};

export default YourGame;
```

### 2. Create the Game Page

Create a new Astro page in `src/pages/games/`:

```astro
---
// src/pages/games/your-game.astro
import Container from "@components/Container.astro";
import Nav from "@components/Nav.astro";
import PageLayout from "@layouts/PageLayout.astro";
import YourGameComponent from "@components/games/YourGame.tsx";
---

<PageLayout 
  title="Your Game" 
  description="Description of your game for SEO."
>
  <Container>
    <div class="space-y-2">
      <Nav
        breadCrumbsItems={[
          { href: "/games", label: "Games" },
          { href: "/games/your-game", label: "Your Game" },
        ]}
      />
    </div>
    
    <div class="space-y-4 my-10">
      <div class="flex items-center gap-1.5">
        <div class="font-base text-sm">Easy</div>
        &bull;
        <div class="font-base text-sm">Category</div>
      </div>
      <div class="text-2xl font-semibold font-serif text-black dark:text-white">
        Your Game
      </div>
    </div>
    
    <article class="space-y-6">
      <section>
        <p>Game description and backstory here.</p>
      </section>

      <section>
        <h4 class="font-semibold mb-3">How to Play</h4>
        <ul class="space-y-1 text-sm">
          <li><strong>Instructions</strong> here</li>
        </ul>
      </section>

      <section class="py-8">
        <YourGameComponent client:idle />
      </section>
    </article>
  </Container>
</PageLayout>
```

### 3. Add to Games Listing

Update `src/pages/games/index.astro` to include your new game in the `staticGames` array:

```tsx
const staticGames = [
  {
    title: "Conway's Game of Life",
    description: "A mesmerizing cellular automaton where simple rules create complex, beautiful patterns.",
    href: "/games/game-of-life",
    date: new Date("2025-08-13"),
    difficulty: "Easy",
    category: "Simulation"
  },
  {
    title: "Your Game",
    description: "Your game description here.",
    href: "/games/your-game",
    date: new Date("2025-08-13"),
    difficulty: "Medium", // Easy, Medium, Hard
    category: "Puzzle"   // e.g., Puzzle, Arcade, Strategy, Simulation
  }
];
```

## Design Guidelines

### Styling
- Use Tailwind CSS classes that match the site's design system
- Follow dark/light theme patterns: `dark:bg-stone-800`, `dark:text-white`
- Use `font-mono` for controls and UI elements
- Use transitions for interactive elements: `transition-colors duration-300`

### Colors
- Primary actions: `bg-black text-white dark:bg-white dark:text-black`
- Secondary actions: `bg-stone-200 dark:bg-stone-700`
- Borders: `border-black/15 dark:border-white/15`
- Hover states: `hover:bg-stone-300 dark:hover:bg-stone-600`

### Interactivity
- Use `client:idle` for most games (better performance than `client:load`)
- Use `client:visible` if the game should only load when scrolled into view
- Handle loading states gracefully
- Ensure all interactive elements have hover states

### Accessibility
- Use semantic HTML elements
- Ensure sufficient color contrast
- Add appropriate ARIA labels for screen readers
- Make games keyboard accessible where possible

### Performance
- Keep game logic efficient
- Use `useCallback` and `useMemo` for expensive operations
- Implement proper cleanup in `useEffect` hooks
- Consider using `requestAnimationFrame` for animations

## Testing

After creating a new game:

1. **Build test**: `npm run build`
2. **Development test**: `npm run dev` and navigate to your game
3. **Functionality test**: Ensure all controls work
4. **Responsive test**: Test on different screen sizes
5. **Theme test**: Test both light and dark modes
6. **Performance test**: Check for smooth interactions

## File Naming Conventions

- **Component files**: `PascalCase.tsx` (e.g., `GameOfLife.tsx`, `TicTacToe.tsx`)
- **Page files**: `kebab-case.astro` (e.g., `game-of-life.astro`, `tic-tac-toe.astro`)
- **URLs**: Match the page file name (e.g., `/games/tic-tac-toe`)

## Examples

Look at `game-of-life.astro` and `components/games/GameOfLife.tsx` as reference implementations for:
- State management with React hooks
- Game loop implementation
- UI controls and layout
- Proper TypeScript usage
- Astro + React integration

Remember: Games should be simple, fun, and completely ad-free! 🎮