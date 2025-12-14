import React, { useRef, useEffect, useState } from 'react';
import { GameState, LineCoordinates } from '../types';
import { gameService } from '../services/gameService';

interface GameBoardProps {
  gameState: GameState;
  playerNum: number;
  isMyTurn: boolean;
}

const GameBoard: React.FC<GameBoardProps> = ({ gameState, playerNum, isMyTurn }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredLine, setHoveredLine] = useState<LineCoordinates | null>(null);
  const [recentLines, setRecentLines] = useState<Array<{type: 'H'|'V', x: number, y: number, player: number}>>([]);
  const prevGameStateRef = useRef<GameState | null>(null);

  const BASE_SIZE = 1000; 
  const PADDING = 100;
  
  const GRID_ROWS = (gameState.board.vertical.length || 0) + 1;
  const GRID_COLS = gameState.board.vertical[0]?.length || 4;

  const AVAILABLE_WIDTH = BASE_SIZE - (PADDING * 2);
  const denom = Math.max(GRID_ROWS - 1, GRID_COLS - 1) || 1;
  const CELL_SIZE = AVAILABLE_WIDTH / denom;
  const DOT_RADIUS = 14; 
  const LINE_THICKNESS = 18;

  // Device pixel ratio for high-DPI screens (mobile)
  const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
  const CANVAS_SIZE = BASE_SIZE * dpr;

  const getDotPos = (row: number, col: number) => {
    const gridWidth = (GRID_COLS - 1) * CELL_SIZE;
    const gridHeight = (GRID_ROWS - 1) * CELL_SIZE;
    const offsetX = (AVAILABLE_WIDTH - gridWidth) / 2;
    const offsetY = (AVAILABLE_WIDTH - gridHeight) / 2;

    return {
      x: PADDING + offsetX + col * CELL_SIZE,
      y: PADDING + offsetY + row * CELL_SIZE
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Scale context for DPI (all drawing scaled automatically)
    ctx.save();
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, BASE_SIZE, BASE_SIZE);

    const { boxes } = gameState.board;

    // --- 1. Draw Completed Boxes ---
    for (let r = 0; r < boxes.length; r++) {
      for (let c = 0; c < boxes[r].length; c++) {
        const owner = boxes[r][c];
        if (owner !== -1) {
          const topLeft = getDotPos(r, c);
          
          // CRITICAL FIX: Reduced gap to ensure box touches the lines.
          // Line extends 9px from center (18/2). 
          // Setting gap to 8px ensures 1px overlap under the line, eliminating white space.
          const gap = 8; 
          const size = CELL_SIZE - (gap * 2);

          const x = topLeft.x + gap;
          const y = topLeft.y + gap;
          
          // Smooth rounded corners that tuck nicely under the dots
          const radius = 16; 

          ctx.beginPath();
          ctx.roundRect(x, y, size, size, radius);
          
          ctx.fillStyle = owner === 0 ? '#ff8fab' : '#8ecae6';
          ctx.fill();
        }
      }
    }

    // --- Helper for Lines ---
    ctx.lineCap = 'round';
    
    const drawLine = (start: {x:number, y:number}, end: {x:number, y:number}, color: string, width = LINE_THICKNESS) => {
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.strokeStyle = color;
      ctx.stroke();
    };

    const { horizontal, vertical } = gameState.board;

    // --- 2. Draw INACTIVE Line Guides ---
    horizontal.forEach((row, rIdx) => {
        row.forEach((isSet, cIdx) => {
            if (isSet === 0) {
                const start = getDotPos(rIdx, cIdx);
                const end = getDotPos(rIdx, cIdx + 1);
                drawLine(start, end, '#F1F5F9', LINE_THICKNESS - 6); 
            }
        });
    });

    vertical.forEach((row, rIdx) => {
        row.forEach((isSet, cIdx) => {
            if (isSet === 0) {
                const start = getDotPos(rIdx, cIdx);
                const end = getDotPos(rIdx + 1, cIdx);
                drawLine(start, end, '#F1F5F9', LINE_THICKNESS - 6);
            }
        });
    });

    // --- 3. Draw Active Lines ---
    // These draw ON TOP of the filled boxes, creating the clean frame effect.
    horizontal.forEach((row, rIdx) => {
      row.forEach((isSet, cIdx) => {
        if (isSet === 1) {
            const start = getDotPos(rIdx, cIdx);
            const end = getDotPos(rIdx, cIdx + 1);
            drawLine(start, end, '#334155');
        }
      });
    });

    vertical.forEach((row, rIdx) => {
      row.forEach((isSet, cIdx) => {
        if (isSet === 1) {
            const start = getDotPos(rIdx, cIdx);
            const end = getDotPos(rIdx + 1, cIdx);
            drawLine(start, end, '#334155');
        }
      });
    });

    // --- 4. Draw Recent Line Animation ---
    recentLines.forEach(line => {
      const { type, x, y, player } = line;
      let start, end;
      if (type === 'H') {
        start = getDotPos(y, x);
        end = getDotPos(y, x + 1);
      } else {
        start = getDotPos(y, x);
        end = getDotPos(y + 1, x);
      }
      ctx.shadowColor = player === 0 ? '#ff8fab' : '#8ecae6';
      ctx.shadowBlur = 25;
      drawLine(start, end, player === 0 ? '#ff8fab' : '#8ecae6');
      ctx.shadowBlur = 0;
    });

    // --- 5. Draw Hover Preview ---
    if (hoveredLine && isMyTurn && !gameState.game_over) {
      const { type, x, y } = hoveredLine;
      let start, end;
      if (type === 'H') {
        start = getDotPos(y, x);
        end = getDotPos(y, x + 1);
      } else {
        start = getDotPos(y, x);
        end = getDotPos(y + 1, x);
      }
      
      ctx.save();
      ctx.setLineDash([0, 20]);
      ctx.lineCap = 'round';
      ctx.lineDashOffset = 10;
      drawLine(start, end, '#64748B', LINE_THICKNESS); 
      ctx.restore();
    }

    // --- 6. Draw Dots ---
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const pos = getDotPos(r, c);
        
        ctx.beginPath();
        ctx.arc(pos.x, pos.y + 4, DOT_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(51, 65, 85, 0.15)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, DOT_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = '#64748B'; 
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(pos.x - 3, pos.y - 3, DOT_RADIUS * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = '#94A3B8';
        ctx.fill();
      }
    }

    ctx.restore(); // restore context scale

  }, [gameState, hoveredLine, isMyTurn, recentLines, GRID_ROWS, GRID_COLS, dpr]);

  // Animation logic unchanged
  useEffect(() => {
    if (!gameState) return;
    if (!prevGameStateRef.current) { prevGameStateRef.current = gameState; return; }
    const prev = prevGameStateRef.current;
    const curr = gameState;
    const newLines: Array<{type: 'H'|'V', x: number, y: number, player: number}> = [];
    
    const hRows = curr.board.horizontal?.length || 0;
    const hCols = curr.board.horizontal?.[0]?.length || 0;
    for (let r = 0; r < hRows; r++) {
      for (let c = 0; c < hCols; c++) {
        if (curr.board.horizontal[r][c] === 1 && prev.board.horizontal?.[r]?.[c] === 0) {
          newLines.push({ type: 'H', x: c, y: r, player: prev.turn });
        }
      }
    }
    const vRows = curr.board.vertical?.length || 0;
    const vCols = curr.board.vertical?.[0]?.length || 0;
    for (let r = 0; r < vRows; r++) {
      for (let c = 0; c < vCols; c++) {
        if (curr.board.vertical[r][c] === 1 && prev.board.vertical?.[r]?.[c] === 0) {
          newLines.push({ type: 'V', x: c, y: r, player: prev.turn });
        }
      }
    }
    if (newLines.length > 0) {
      setRecentLines(prev => [...prev, ...newLines]);
      setTimeout(() => setRecentLines(prev => prev.filter(l => !newLines.includes(l))), 600);
    }
    prevGameStateRef.current = curr;
  }, [gameState]);

  // Helper function to detect which line is at a position
  const detectLineAtPosition = (clientX: number, clientY: number, pointerType: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    // Scale to logical canvas size (BASE_SIZE)
    const scaleX = BASE_SIZE / rect.width;
    const scaleY = BASE_SIZE / rect.height;
    const mouseX = (clientX - rect.left) * scaleX;
    const mouseY = (clientY - rect.top) * scaleY;
    
    // Much larger threshold for touch (2.5x line thickness) vs mouse (1x line thickness)
    const threshold = pointerType === 'touch' ? 220 : 80;
    let found: LineCoordinates | null = null;
    let minDistance = threshold;

    const hRows = gameState.board.horizontal?.length || 0;
    const hCols = gameState.board.horizontal?.[0]?.length || 0;
    for (let r = 0; r < hRows; r++) {
      for (let c = 0; c < hCols; c++) {
        if (gameState.board.horizontal[r][c] === 1) continue; 
        const start = getDotPos(r, c); const end = getDotPos(r, c + 1);
        const lineX = Math.max(start.x, Math.min(mouseX, end.x));
        const dist = Math.sqrt(Math.pow(mouseX - lineX, 2) + Math.pow(mouseY - start.y, 2));
        if (dist < minDistance) { minDistance = dist; found = { type: 'H', x: c, y: r }; }
      }
    }

    const vRows = gameState.board.vertical?.length || 0;
    const vCols = gameState.board.vertical?.[0]?.length || 0;
    for (let r = 0; r < vRows; r++) {
      for (let c = 0; c < vCols; c++) {
        if (gameState.board.vertical[r][c] === 1) continue;
        const start = getDotPos(r, c); const end = getDotPos(r + 1, c);
        const lineY = Math.max(start.y, Math.min(mouseY, end.y));
        const dist = Math.sqrt(Math.pow(mouseX - start.x, 2) + Math.pow(mouseY - lineY, 2));
        if (dist < minDistance) { minDistance = dist; found = { type: 'V', x: c, y: r }; }
      }
    }
    return found;
  };

  // Unified pointer handler (mouse + touch)
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isMyTurn || gameState.game_over) { setHoveredLine(null); return; }
    const found = detectLineAtPosition(e.clientX, e.clientY, e.pointerType);
    setHoveredLine(found);
  };

  return (
    <div className="w-full aspect-square bg-white rounded-[2rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] p-2">
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        className="w-full h-full"
        style={{ 
          cursor: (hoveredLine && isMyTurn) ? 'pointer' : 'default',
          touchAction: 'none' // Prevent scrolling/zooming on touch
        }}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoveredLine(null)}
        onPointerDown={(e) => {
          e.preventDefault(); // prevent default touch behavior
          if (!isMyTurn || gameState.game_over) return;
          
          // Re-detect line at click position (not just using hover state)
          const clickedLine = detectLineAtPosition(e.clientX, e.clientY, e.pointerType);
          
          if (clickedLine) {
            console.debug('[GameBoard] pointer tap', { clickedLine, isMyTurn, pointerType: e.pointerType });
            gameService.sendMessage({ op: 'PLACE_LINE', x: clickedLine.x, y: clickedLine.y, orientation: clickedLine.type });
          } else {
            console.debug('[GameBoard] tap missed - no line detected', { pointerType: e.pointerType });
          }
        }}
      />
    </div>
  );
};

export default GameBoard;