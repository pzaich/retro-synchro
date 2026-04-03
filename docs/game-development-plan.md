# Retro Synchro - Game Development Plan

## Context
Building "Retro Synchro" — an artistic swimming management game inspired by Retro Bowl. The player coaches a synchro team: designing routines, managing swimmers, and competing in tournaments. The game uses pixel-art retro aesthetics, runs entirely in-browser, and deploys to Vercel as a static site.

---

## Tech Stack

| Tool | Choice | Why |
|------|--------|-----|
| **Game Framework** | **Phaser 3** | Batteries-included (scenes, tweens, sprites, input, audio). Official Vite+TS template. Largest HTML5 game ecosystem. Kaboom is deprecated, Excalibur is pre-1.0, PixiJS is renderer-only. |
| **Bundler** | Vite | Fast dev server, simple config, Vercel-native |
| **Language** | TypeScript | Type safety for complex game state |
| **Deploy** | Vercel | Static `dist/` folder, auto-deploy from GitHub |

**Phaser scale config** (critical for retro look):
- Native resolution: 320x180, scaled 4x to 1280x720
- `pixelArt: true` disables anti-aliasing globally
- `Phaser.Scale.FIT` + `CENTER_BOTH` for responsive sizing

---

## Project Structure

```
retro-synchro/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vercel.json
├── public/assets/
│   ├── sprites/          # Sprite sheets
│   ├── audio/            # Music + SFX
│   └── fonts/            # Bitmap pixel fonts
├── src/
│   ├── main.ts           # Phaser game config + bootstrap
│   ├── config.ts         # Game constants
│   ├── scenes/
│   │   ├── BootScene.ts          # Asset preloading
│   │   ├── TitleScene.ts         # Main menu
│   │   ├── ManageScene.ts        # Team hub / roster
│   │   ├── RoutineEditorScene.ts # Routine builder
│   │   ├── SwimmerDetailScene.ts # Swimmer stats
│   │   ├── CompetitionScene.ts   # Mini-game playback
│   │   ├── ResultsScene.ts       # Score reveal + progression
│   │   └── SeasonScene.ts        # Tournament calendar
│   ├── systems/
│   │   ├── GameState.ts          # Central state singleton
│   │   ├── SaveManager.ts        # localStorage save/load
│   │   ├── ProgressionSystem.ts  # XP, leveling, unlocks
│   │   ├── ScoringEngine.ts      # Judge scoring algorithm
│   │   ├── RoutineValidator.ts   # Difficulty vs. stats check
│   │   └── OpponentGenerator.ts  # Randomized rival team AI
│   ├── entities/
│   │   ├── Swimmer.ts            # Swimmer data model
│   │   ├── Team.ts               # Team roster (8 active + 2 alternates)
│   │   ├── Element.ts            # Synchro element (lift/stroke/hybrid)
│   │   └── Routine.ts            # Ordered element list + formations
│   ├── ui/
│   │   ├── UIButton.ts           # Reusable pixel button
│   │   ├── UIPanel.ts            # Panel container
│   │   ├── StatBar.ts            # Stat progress bar
│   │   ├── ElementCard.ts        # Draggable element card
│   │   └── ScoreDisplay.ts       # Animated score reveal
│   ├── animations/
│   │   ├── FormationManager.ts   # Tween paths for formations
│   │   └── RoutinePlayer.ts      # Orchestrates element playback
│   └── data/
│       ├── elements.json         # All synchro elements + metadata
│       ├── formations.json       # Formation patterns + positions
│       └── names.json            # Random name generator data
```

---

## Core Game Systems

### State Management (`GameState.ts`)
- Plain TypeScript singleton — no external lib needed
- All scenes read/write `GameState.getInstance()`
- Scenes pull data on `create()`, no reactivity framework

### Save/Load (`SaveManager.ts`)
- localStorage with versioned JSON blob + migration functions
- Auto-save on scene transitions
- JSON export/import for backup
- 3 save slots

### Scoring Engine (`ScoringEngine.ts`)
- Per-element score = `base_value * execution * artistry_bonus * sync_bonus`
- `execution`: 0.0-1.0 from stat check (element difficulty vs. swimmer stats)
- `artistry_bonus`: formation variety, element combos (repeats score less)
- `sync_bonus`: degrades with fatigue (endurance stat matters late in routine)
- Judge variation: each judge has slight random bias (+/- 0.3)
- Final: sum normalized to 0-10 per category

### Progression (`ProgressionSystem.ts`)
- **Swimmers**: XP from competitions, exponential level curve, +1 stat per level
- **Stats**: artistry (1-10), athleticism (1-10), endurance (1-10)
- **Coach**: separate XP track, level-ups unlock new element tiers
- **Element unlock tree**: higher tiers require coach level + minimum swimmer stats

### Opponent AI (`OpponentGenerator.ts`)
- Generates randomized rival teams for each competition
- Each rival has: team name, 8 swimmers with randomized stats, a pre-built routine
- Difficulty scales with tournament tier / season progression
- Rival routine score is pre-calculated using the same ScoringEngine (no cheating)
- Provides variety: some rivals are high-difficulty/low-execution, others safe/consistent

### Routine Validation (`RoutineValidator.ts`)
- Compares each element's difficulty to team average stats
- Highlights risky elements in the editor
- Higher difficulty gap → higher chance of mistakes during competition

---

## Key Screens

### Routine Editor
- Left panel: available elements (filtered by unlocks)
- Right panel: routine timeline (drag elements onto slots)
- Bottom: difficulty meter showing risk level
- Formation selector per element

### Competition Mini-Game
1. Pre-comp: show opponent, confirm routine
2. Playback: top-down pool view, swimmers animate element-by-element via tweens
3. Per-element: score flash after each element (success/partial/fail)
4. Mistakes: visible desync animation when difficulty exceeds swimmer ability
5. Results: judges reveal scores across categories

### Management Hub
- Team roster: **8 swimmers + 2 alternates** (10 total, always)
- Swimmer portraits + key stats, alternates marked distinctly
- Navigation to routine editor, swimmer details, season calendar
- Can swap alternates into the active 8 before competitions

---

## Element Database (from World Aquatics research)

88 real artistic swimming elements organized into 7 categories, mapped to 5 game tiers (matching English Grading System):

### Tier 1 — Beginner (unlocked at start, Coach Level 1)
- **Positions:** Back Layout, Front Layout, Tub, Ballet Leg, Inverted Tuck
- **Sculls:** Support Scull, Stationary Scull, Propeller Scull, Eggbeater Kick
- **Spins:** Spin 180
- **Formations:** Circle, Straight Line, Diagonal Line

### Tier 2 — Intermediate (Coach Level 2-3)
- **Positions:** Double Ballet Leg, Flamingo, Bent Knee (Heron), Crane, Fishtail, Side Fishtail, Vertical, Surface Arch, Back Pike, Front Pike
- **Figures:** Neptunus (DD 1.8), Tower (DD 1.6), Back Tuck Somersault (DD 1.4), Porpoise (DD 1.5), Catalina Rotation (DD 1.6), Blossom (DD 1.5)
- **Sculls:** Torpedo Scull, Alligator Scull, Paddle Scull, Canoe Scull
- **Spins:** Spin Up 360, Spin Down 360, Twist 180
- **Formations:** V-Formation, Diamond, Square/Block, Triangle
- **Hybrids:** Vertical Descent, Position Change Family (basic)

### Tier 3 — Advanced (Coach Level 4-5)
- **Positions:** Knight, Split Position, Submerged Back Pike
- **Figures:** Barracuda (DD 1.8), Front Walkover (DD 1.9), Aurora (DD 2.0), Ariana (DD 2.0), Saturn (DD 2.0), London (DD 2.1)
- **Sculls:** Barrel Scull, Split Scull, Spinning Scull, Totem Scull
- **Spins:** Combined Spin 360+360, Twist 360
- **Formations:** Star/Pinwheel, Staggered Lines, Pattern Change transitions
- **Lifts:** Balance Stack (Head Up), Balance Lift, Platform Lift, Pair Acrobatic, Team Acrobatic
- **Hybrids:** Thrust Family, Walkover Family, Head First Boost & Descent

### Tier 4 — Elite (Coach Level 6-7)
- **Figures:** Cyclone Open 180 (DD 2.2), Ipanema Spinning 180 (DD 2.2), Swordfish Straight Leg (DD 2.3), Albatross Spin Up 360 (DD 2.4), Flying Fish Spinning 360 (DD 2.5)
- **Lifts:** Balance Stack (Head Down), Platform with Dismount, Airborne Throw, Airborne Jump
- **Spins:** Continuous Spin 720
- **Hybrids:** Spin Family (advanced), Twist Family (advanced)

### Tier 5 — Master (Coach Level 8-10)
- **Figures:** Whip Continuous Spin 720 (DD 2.8), Barracuda Airborne Split Spin Up 180 (DD 2.9), Flamingo Bent Knee Combined Spin 360+360 (DD 3.0)
- **Lifts:** Combined Airborne-Balance, Combined Airborne-Platform, Rocket Split
- **Spins:** Continuous Spin 1080
- **Hybrids:** Custom Hybrid Sequences (compose 5+ skills with declared difficulty)

### Scoring Formula (mirrors real sport)
- **Per-element:** `execution_score (0-10) x difficulty_degree x sync_bonus`
- **Declared Difficulty mechanic:** player declares DD before competition; fail to execute = base mark penalty (0.5)
- **Pattern Change Bonus:** +0.3 per formation transition
- **Judge panel:** 5 judges, drop high and low, average remaining 3
- **Final score:** sum of element scores across execution, artistry, and difficulty categories

> Full element reference with descriptions: see `docs/artistic-swimming-elements.md`

---

## Art Approach
- 16x16 base tile grid, 24x24 swimmer sprites
- Constrained color palette (32 colors max)
- **Start with colored rectangles** — do not block on art early
- Tools: Aseprite or Piskel for sprites, BitmapFont for text

---

## Development Phases

### Phase 1: Scaffold + Title Screen
- Init Vite + TS + Phaser 3 project
- BootScene (loading), TitleScene (menu)
- GameState singleton + SaveManager
- Deploy to Vercel to confirm pipeline
- **Result**: Bootable game with title screen, save/load works

### Phase 2: Data Models + Team View
- Swimmer, Team, Element, Routine entities
- `elements.json` with ~15 starter elements
- ManageScene (roster display), SwimmerDetailScene (stats)
- **Result**: Can view team and swimmer stats

### Phase 3: Routine Editor
- RoutineEditorScene with element selection + timeline
- RoutineValidator + difficulty meter
- **Result**: Can create and save routines

### Phase 4: Competition (core feature)
- CompetitionScene with pool view + swimmer sprites
- FormationManager (3-4 formations)
- RoutinePlayer (element-by-element playback with tweens)
- ScoringEngine + ResultsScene
- **Result**: Full competition loop with animation and scoring

### Phase 5: Progression Loop
- XP, leveling, stat allocation, coach unlocks
- SeasonScene with tournament calendar
- Opponent generation
- **Result**: Complete gameplay loop

### Phase 6: Polish
- Final art, 30-40 elements, 8-10 formations
- Audio (chiptune music, SFX)
- Juice (screen shake, particles, crowd noise)
- Mobile touch support
- Balancing + playtesting

---

## Verification
- After Phase 1: game loads in browser, title screen renders at pixel-perfect 320x180 scaled up, save/load round-trips to localStorage
- After Phase 3: routines can be built and validated, difficulty warnings appear
- After Phase 4: full competition plays out with animations, scores generate correctly
- Run `npm run build` and verify `dist/` deploys clean to Vercel
- Test on Chrome, Firefox, Safari; verify pixel scaling is crisp
