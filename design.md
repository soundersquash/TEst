# Flappy Bird Game - Design Style Guide

## Design Philosophy

### Color Palette
- **Primary**: Soft sky blue (#87CEEB) - calming, game-friendly background
- **Secondary**: Warm coral (#FF6B6B) - accent color for buttons and highlights  
- **Tertiary**: Deep forest green (#2E8B57) - pipe obstacles and natural elements
- **Neutral**: Charcoal gray (#36454F) - text and UI elements
- **Background**: Gradient from light sky blue to soft white (#F0F8FF)

### Typography
- **Display Font**: "Playfair Display" - elegant serif for headings and game title
- **Body Font**: "Inter" - clean, modern sans-serif for UI text and scores
- **Monospace**: "JetBrains Mono" - for score displays and technical elements

### Visual Language
- **Minimalist Aesthetic**: Clean, uncluttered interface focusing on gameplay
- **Modern Editorial Style**: Inspired by contemporary web design with sophisticated color choices
- **Smooth Animations**: Subtle transitions and hover effects using Anime.js
- **Geometric Shapes**: Simple, clean visual elements with rounded corners
- **Consistent Spacing**: 8px grid system for uniform layout

## Visual Effects & Styling

### Used Libraries
- **Anime.js**: Smooth bird flapping animations and UI transitions
- **p5.js**: Particle effects for collision explosions and background elements
- **Matter.js**: Realistic physics simulation for bird movement and gravity
- **ECharts.js**: Beautiful score visualization and leaderboard charts

### Animation Effects
- **Bird Flapping**: Smooth wing animation using Anime.js rotation
- **Particle Explosion**: p5.js particles when bird crashes into pipes
- **Score Counter**: Animated number increment with bounce effect
- **Background Parallax**: Subtle cloud movement for depth
- **Button Hover**: Gentle scale and color transitions

### Header Effect
- **Gradient Background**: Animated sky gradient using CSS and Anime.js
- **Floating Clouds**: Subtle p5.js particle system for atmospheric effect
- **Typography Animation**: Staggered letter appearance for game title

### Interactive Elements
- **Game Canvas**: Clean border with subtle shadow effect
- **Score Display**: Large, readable numbers with highlight effect
- **Control Buttons**: Rounded corners with hover animations
- **Leaderboard**: Elegant table design with alternating row colors

### Responsive Design
- **Mobile-First**: Optimized for touch controls and small screens
- **Flexible Layout**: CSS Grid and Flexbox for adaptive design
- **Touch-Friendly**: Large tap targets for mobile gameplay
- **Performance Optimized**: Efficient canvas rendering and asset loading