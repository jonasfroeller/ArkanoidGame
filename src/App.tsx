import { Component, onMount } from 'solid-js';
import { Game } from 'phaser';
import { gameConfig } from './game/config';
import './App.css';

const App: Component = () => {
  onMount(() => {
    new Game(gameConfig);
  });

  return (
    <div class="min-h-screen flex flex-col items-center justify-center">
      <h1 class="text-4xl font-bold text-white mb-8">Arkanoid/Breakout</h1>
      <div id="game-container" class="rounded-lg overflow-hidden shadow-2xl"></div>
      <div class="mt-4 text-white text-center px-4">
        <p>Use left and right arrow keys to move the paddle</p>
      </div>
    </div>
  );
};

export default App;