import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface Note {
  id: number;
  type: 'red' | 'blue';
  timing: number;
  position: number;
}

interface Level {
  id: number;
  name: string;
  difficulty: number;
  bpm: number;
  duration: number;
}

const levels: Level[] = [
  { id: 1, name: 'Cookie Melody', difficulty: 2, bpm: 120, duration: 30 },
  { id: 2, name: 'Sweet Beat', difficulty: 3, bpm: 140, duration: 35 },
  { id: 3, name: 'Sugar Rush', difficulty: 5, bpm: 180, duration: 40 },
];

const DJ_COOKIE_IMAGE = 'https://cdn.poehali.dev/projects/67fcc573-c3e7-4226-9156-87a0f85ff2c9/files/771b44d6-c799-4792-b6d2-3de7b9c15289.jpg';

export default function Index() {
  const [screen, setScreen] = useState<'menu' | 'game' | 'results'>('menu');
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNotes, setActiveNotes] = useState<Note[]>([]);
  const [gameTime, setGameTime] = useState(0);
  const [hitEffect, setHitEffect] = useState<{ type: string; position: number } | null>(null);
  const gameStartTime = useRef<number>(0);
  const animationFrame = useRef<number>();

  const startGame = (level: Level) => {
    setSelectedLevel(level);
    setScore(0);
    setCombo(0);
    setGameTime(0);
    generateNotes(level);
    setScreen('game');
    gameStartTime.current = Date.now();
  };

  const generateNotes = (level: Level) => {
    const noteCount = Math.floor((level.duration * level.bpm) / 60 / 2);
    const newNotes: Note[] = [];
    
    for (let i = 0; i < noteCount; i++) {
      newNotes.push({
        id: i,
        type: Math.random() > 0.5 ? 'red' : 'blue',
        timing: (i * 2000) + Math.random() * 500,
        position: Math.random() * 60 + 20,
      });
    }
    
    setNotes(newNotes.sort((a, b) => a.timing - b.timing));
  };

  useEffect(() => {
    if (screen !== 'game' || !selectedLevel) return;

    const gameLoop = () => {
      const currentTime = Date.now() - gameStartTime.current;
      setGameTime(currentTime);

      const upcomingNotes = notes.filter(
        note => note.timing <= currentTime + 3000 && note.timing > currentTime - 500
      );
      setActiveNotes(upcomingNotes);

      if (currentTime >= selectedLevel.duration * 1000) {
        setScreen('results');
        return;
      }

      animationFrame.current = requestAnimationFrame(gameLoop);
    };

    animationFrame.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [screen, notes, selectedLevel]);

  const hitNote = (noteType: 'red' | 'blue') => {
    const hitWindow = 300;
    const currentTime = gameTime;
    
    const hitNoteIndex = activeNotes.findIndex(
      note => 
        note.type === noteType && 
        Math.abs(note.timing - currentTime) < hitWindow
    );

    if (hitNoteIndex !== -1) {
      const hitNote = activeNotes[hitNoteIndex];
      const timing = Math.abs(hitNote.timing - currentTime);
      
      let points = 100;
      if (timing < 100) points = 300;
      else if (timing < 200) points = 200;
      
      setScore(prev => prev + points + (combo * 10));
      setCombo(prev => prev + 1);
      
      setHitEffect({ type: timing < 100 ? 'PERFECT!' : 'GOOD!', position: hitNote.position });
      setTimeout(() => setHitEffect(null), 500);
      
      setNotes(prev => prev.filter(n => n.id !== hitNote.id));
    } else {
      setCombo(0);
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (screen !== 'game') return;
      
      if (e.key === 'd' || e.key === 'f' || e.key === 'в' || e.key === 'а') {
        hitNote('red');
      } else if (e.key === 'j' || e.key === 'k' || e.key === 'о' || e.key === 'л') {
        hitNote('blue');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [screen, activeNotes, gameTime, combo]);

  if (screen === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-300 via-purple-300 to-blue-300 flex flex-col items-center justify-center p-6">
        <div className="text-center mb-12 animate-bounce-in">
          <h1 className="text-7xl font-bold text-white mb-4" style={{ textShadow: '0 8px 0 rgba(0,0,0,0.2)' }}>
            🍪 COOKIE RHYTHM 🍪
          </h1>
          <p className="text-2xl text-white/90 font-medium">Попади в ритм!</p>
        </div>

        <div className="grid gap-6 w-full max-w-2xl">
          {levels.map((level) => (
            <Card 
              key={level.id}
              className="p-6 bg-white/95 backdrop-blur game-shadow hover:scale-105 transition-transform cursor-pointer border-4 border-pink-400"
              onClick={() => startGame(level)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-6xl">🎵</div>
                  <div>
                    <h3 className="text-3xl font-bold text-gray-800">{level.name}</h3>
                    <div className="flex gap-2 mt-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className="text-2xl">
                          {i < level.difficulty ? '⭐' : '☆'}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-semibold text-purple-600">{level.bpm} BPM</div>
                  <div className="text-lg text-gray-600">{level.duration}s</div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-12 p-6 bg-white/90 rounded-3xl game-shadow max-w-2xl">
          <h3 className="text-2xl font-bold text-gray-800 mb-3">Управление</h3>
          <div className="grid grid-cols-2 gap-4 text-lg">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-pink-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl note-shadow">
                D/F
              </div>
              <span className="text-gray-700 font-medium">Красные ноты</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl note-shadow">
                J/K
              </div>
              <span className="text-gray-700 font-medium">Синие ноты</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'game') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-orange-300 relative overflow-hidden">
        <div className="absolute top-8 left-0 right-0 flex justify-between items-center px-12 z-10">
          <div className="bg-white/95 backdrop-blur px-8 py-4 rounded-3xl game-shadow border-4 border-yellow-400">
            <div className="text-sm font-medium text-gray-600 mb-1">СЧЁТ</div>
            <div className="text-4xl font-bold text-purple-600">{score}</div>
          </div>
          
          <div className="bg-white/95 backdrop-blur px-8 py-4 rounded-3xl game-shadow border-4 border-pink-400">
            <div className="text-sm font-medium text-gray-600 mb-1">КОМБО</div>
            <div className="text-4xl font-bold text-pink-500">{combo}x</div>
          </div>

          <div className="bg-white/95 backdrop-blur px-6 py-4 rounded-3xl game-shadow">
            <div className="text-lg font-bold text-gray-700">{selectedLevel?.name}</div>
            <div className="flex gap-1 mt-1">
              {Array.from({ length: selectedLevel?.difficulty || 0 }).map((_, i) => (
                <span key={i} className="text-xl">⭐</span>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="relative">
            <img 
              src={DJ_COOKIE_IMAGE} 
              alt="DJ Cookie"
              className="w-64 h-64 object-contain drop-shadow-2xl animate-bounce-in"
              style={{
                animation: combo > 5 ? 'bounce 0.5s ease-in-out infinite' : 'none'
              }}
            />
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-48 h-8 bg-black/20 rounded-full blur-xl"></div>
          </div>
        </div>

        {hitEffect && (
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 z-30 animate-bounce-in pointer-events-none">
            <div className="text-6xl font-bold text-white px-8 py-4 rounded-3xl"
                 style={{ textShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
              {hitEffect.type}
            </div>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/40 to-transparent z-10">
          <div className="absolute bottom-24 left-0 right-0 h-2 bg-white/30 backdrop-blur"></div>
          
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
            <div className="relative h-20 bg-white/20 backdrop-blur rounded-t-3xl border-4 border-white/40 overflow-hidden">
              {activeNotes.map((note) => {
                const progress = (gameTime - (note.timing - 3000)) / 3000;
                const xPos = progress * 100;
                
                return (
                  <div
                    key={note.id}
                    className="absolute top-1/2 -translate-y-1/2 transition-all duration-100"
                    style={{
                      left: `${xPos}%`,
                    }}
                  >
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl note-shadow ${
                      note.type === 'red' 
                        ? 'bg-gradient-to-br from-red-400 to-pink-500' 
                        : 'bg-gradient-to-br from-blue-400 to-cyan-500'
                    }`}>
                      {note.type === 'red' ? '🔴' : '🔵'}
                    </div>
                  </div>
                );
              })}
              
              <div className="absolute left-24 top-0 bottom-0 w-1 bg-yellow-400 z-20">
                <div className="absolute top-1/2 -translate-y-1/2 -left-4 w-8 h-20 border-4 border-yellow-400 rounded-xl animate-pulse"></div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-32 left-0 right-0 flex justify-center gap-12">
            <button
              onClick={() => hitNote('red')}
              className="w-24 h-24 bg-gradient-to-br from-red-400 to-pink-500 rounded-3xl game-shadow hover:scale-110 active:scale-95 transition-transform flex items-center justify-center text-white text-2xl font-bold border-4 border-white"
            >
              D/F
            </button>
            <button
              onClick={() => hitNote('blue')}
              className="w-24 h-24 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-3xl game-shadow hover:scale-110 active:scale-95 transition-transform flex items-center justify-center text-white text-2xl font-bold border-4 border-white"
            >
              J/K
            </button>
          </div>
        </div>

        <Button
          onClick={() => setScreen('menu')}
          variant="secondary"
          className="absolute top-8 right-8 z-10 rounded-2xl px-6 py-6 text-lg font-bold"
        >
          <Icon name="X" size={24} />
        </Button>
      </div>
    );
  }

  if (screen === 'results') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-orange-300 to-pink-300 flex items-center justify-center p-6">
        <Card className="p-12 bg-white/95 backdrop-blur game-shadow max-w-2xl w-full border-4 border-yellow-400 animate-bounce-in">
          <div className="text-center">
            <div className="text-8xl mb-6">🏆</div>
            <h2 className="text-5xl font-bold text-gray-800 mb-4">Результаты!</h2>
            
            <div className="my-8 space-y-4">
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-6 rounded-3xl">
                <div className="text-lg font-medium text-gray-600 mb-2">Итоговый счёт</div>
                <div className="text-6xl font-bold text-purple-600">{score}</div>
              </div>
              
              <div className="bg-gradient-to-r from-pink-100 to-orange-100 p-6 rounded-3xl">
                <div className="text-lg font-medium text-gray-600 mb-2">Максимальное комбо</div>
                <div className="text-5xl font-bold text-pink-500">{combo}x</div>
              </div>
            </div>

            <div className="flex gap-4 justify-center mt-8">
              <Button
                onClick={() => selectedLevel && startGame(selectedLevel)}
                className="px-10 py-7 text-2xl font-bold rounded-3xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 game-shadow"
              >
                <Icon name="RotateCcw" size={28} className="mr-2" />
                Ещё раз
              </Button>
              <Button
                onClick={() => setScreen('menu')}
                variant="secondary"
                className="px-10 py-7 text-2xl font-bold rounded-3xl game-shadow"
              >
                <Icon name="Home" size={28} className="mr-2" />
                В меню
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return null;
}