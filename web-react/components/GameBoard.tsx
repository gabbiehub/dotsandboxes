import React, { useRef, useEffect, useState } from 'react';
import { GameState, LineCoordinates } from '../types';
import { gameService } from '../services/gameService';

interface GameBoardProps {
  gameState: GameState;
  playerNum: number;
  isMyTurn: boolean;
  player1Name: string;
  player2Name: string;
}

const GameBoard: React.FC<GameBoardProps> = ({ gameState, playerNum, isMyTurn, player1Name, player2Name }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredLine, setHoveredLine] = useState<LineCoordinates | null>(null);
  const [recentLines, setRecentLines] = useState<Array<{type: 'H'|'V', x: number, y: number, player: number}>>([]);
  const prevGameStateRef = useRef<GameState | null>(null);

  // Constants for drawing
  // We use a fixed internal resolution for simpler math, then scale with CSS
  const CANVAS_SIZE = 600; 
  // Determine grid size from game state or default to 4
  const GRID_ROWS = gameState.board.vertical.length;
  const GRID_COLS = gameState.board.vertical[0]?.length || 4;

  // Reduce padding so the grid fits comfortably in small viewports,
  // but keep a minimum margin for UI and dot radius.
  const PADDING = 36;
  const AVAILABLE_WIDTH = CANVAS_SIZE - (PADDING * 2);
  // Compute denominator as the maximum number of steps between dots
  // on each axis (rows-1, cols-1). This prevents subtle off-by-one
  // layout that can push the final dots out of view on non-square boards.
  const denom = Math.max(GRID_ROWS - 1, GRID_COLS - 1) || 1;
  const CELL_SIZE = AVAILABLE_WIDTH / denom;
  const DOT_RADIUS = 7;
  const LINE_THICKNESS = 10;

  // Helper to get coordinates of a dot
  const getDotPos = (row: number, col: number) => {
    // Center the grid if non-square
    const gridWidth = (GRID_COLS - 1) * CELL_SIZE;
    const gridHeight = (GRID_ROWS - 1) * CELL_SIZE;
    const offsetX = (AVAILABLE_WIDTH - gridWidth) / 2;
    const offsetY = (AVAILABLE_WIDTH - gridHeight) / 2;

    // Compute raw position then clamp to ensure dots are inside the
    // visible canvas area (accounting for dot radius and padding).
    const rawX = PADDING + offsetX + col * CELL_SIZE;
    const rawY = PADDING + offsetY + row * CELL_SIZE;

    const minX = PADDING + DOT_RADIUS;
    const minY = PADDING + DOT_RADIUS;
    const maxX = CANVAS_SIZE - PADDING - DOT_RADIUS;
    const maxY = CANVAS_SIZE - PADDING - DOT_RADIUS;

    const x = Math.min(Math.max(rawX, minX), maxX);
    const y = Math.min(Math.max(rawY, minY), maxY);

    return { x, y };
  };

  // Main Draw Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // 1. Draw Completed Boxes (Backgrounds with usernames)
    const { boxes } = gameState.board;
    for (let r = 0; r < boxes.length; r++) {
      for (let c = 0; c < boxes[r].length; c++) {
        const owner = boxes[r][c];
        if (owner !== -1) {
          const pos = getDotPos(r, c);
          // Darker fill colors for completed boxes
          ctx.fillStyle = owner === 0 ? '#e63946' : '#4dabf7';
          
          // Draw rounded rect for the box
          const boxPadding = 8;
          const size = CELL_SIZE - boxPadding * 2;
          
          ctx.beginPath();
          ctx.roundRect(pos.x + boxPadding, pos.y + boxPadding, size, size, 16);
          ctx.fill();

          // No username text - just solid color fill
        }
      }
    }

    // 2. Draw Recently Placed Lines (Player Colors)
    recentLines.forEach(line => {
      const { type, x, y, player } = line;
      ctx.strokeStyle = player === 0 ? '#e63946' : '#4dabf7'; // Player colors
      ctx.lineWidth = LINE_THICKNESS;
      ctx.lineCap = 'round';
      
      let start, end;
      if (type === 'H') {
        start = getDotPos(y, x);
        end = getDotPos(y, x + 1);
      } else {
        start = getDotPos(y, x);
        end = getDotPos(y + 1, x);
      }
      
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    });

    // 3. Draw Active Lines (Horizontal) - Black for permanent lines
    ctx.lineCap = 'round';
    ctx.lineWidth = LINE_THICKNESS;

    const { horizontal, vertical } = gameState.board;

    horizontal.forEach((row, rIdx) => {
      row.forEach((isSet, cIdx) => {
        // Skip if it's a recent line (already drawn in color)
        if (isSet === 1 && !recentLines.some(l => l.type === 'H' && l.x === cIdx && l.y === rIdx)) {
          ctx.strokeStyle = '#2d3748'; // Dark gray/black
          const start = getDotPos(rIdx, cIdx);
          const end = getDotPos(rIdx, cIdx + 1);
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
        }
      });
    });

    // 4. Draw Active Lines (Vertical)
    vertical.forEach((row, rIdx) => {
      row.forEach((isSet, cIdx) => {
        // Skip if it's a recent line
        if (isSet === 1 && !recentLines.some(l => l.type === 'V' && l.x === cIdx && l.y === rIdx)) {
          ctx.strokeStyle = '#2d3748';
          const start = getDotPos(rIdx, cIdx);
          const end = getDotPos(rIdx + 1, cIdx);
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
        }
      });
    });

    // 5. Draw Hover Guide
    if (hoveredLine && isMyTurn && !gameState.game_over) {
      const { type, x, y } = hoveredLine;
      ctx.strokeStyle = 'rgba(45, 55, 72, 0.3)'; // Light shadow
      ctx.lineWidth = LINE_THICKNESS;
      
      let start, end;
      if (type === 'H') {
        start = getDotPos(y, x);
        end = getDotPos(y, x + 1);
      } else {
        start = getDotPos(y, x);
        end = getDotPos(y + 1, x);
      }
      
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }

    // 6. Draw Dots (Top layer)
    ctx.fillStyle = '#a0a0a0';
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const pos = getDotPos(r, c);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, DOT_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }
    }

  }, [gameState, hoveredLine, isMyTurn, playerNum, recentLines]);  // Main Draw Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // 1. Draw Completed Boxes (Backgrounds with usernames)
    const { boxes } = gameState.board;
    for (let r = 0; r < boxes.length; r++) {
      for (let c = 0; c < boxes[r].length; c++) {
        const owner = boxes[r][c];
        if (owner !== -1) {
          const pos = getDotPos(r, c);
          // Darker fill colors for completed boxes
          ctx.fillStyle = owner === 0 ? '#e63946' : '#4dabf7';
          
          // Draw rounded rect for the box
          const boxPadding = 8;
          const size = CELL_SIZE - boxPadding * 2;
          
          ctx.beginPath();
          ctx.roundRect(pos.x + boxPadding, pos.y + boxPadding, size, size, 16);
          ctx.fill();

          // No username text - just solid color fill
        }
      }
    }

    // 2. Draw Recently Placed Lines (Player Colors)
    recentLines.forEach(line => {
      const { type, x, y, player } = line;
      ctx.strokeStyle = player === 0 ? '#e63946' : '#4dabf7'; // Player colors
      ctx.lineWidth = LINE_THICKNESS;
      ctx.lineCap = 'round';
      
      let start, end;
      if (type === 'H') {
        start = getDotPos(y, x);
        end = getDotPos(y, x + 1);
      } else {
        start = getDotPos(y, x);
        end = getDotPos(y + 1, x);
      }
      
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    });

    // 3. Draw Active Lines (Horizontal) - Black for permanent lines - Black for permanent lines
    ctx.lineCap = 'round';
    ctx.lineWidth = LINE_THICKNESS;

    const { horizontal, vertical } = gameState.board;

    horizontal.forEach((row, rIdx) => {
      row.forEach((isSet, cIdx) => {
        if (isSet === 1) {
          // Skip if this line is currently animating
          const isRecent = recentLines.some(l => l.type === 'H' && l.x === cIdx && l.y === rIdx);
          if (!isRecent) {
            const start = getDotPos(rIdx, cIdx);
            const end = getDotPos(rIdx, cIdx + 1);
            ctx.strokeStyle = '#4a4a4a'; // Dark grey for set lines
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
          }
        }
      });
    });

    // 4. Draw Active Lines (Vertical) - Black for permanent lines
    vertical.forEach((row, rIdx) => {
      row.forEach((isSet, cIdx) => {
        if (isSet === 1) {
          // Skip if this line is currently animating
          const isRecent = recentLines.some(l => l.type === 'V' && l.x === cIdx && l.y === rIdx);
          if (!isRecent) {
            const start = getDotPos(rIdx, cIdx);
            const end = getDotPos(rIdx + 1, cIdx);
            ctx.strokeStyle = '#4a4a4a';
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
          }
        }
      });
    });

    // 5. Draw Hover Shadow Guide (darker, more visible)
    if (hoveredLine && !gameState.game_over && isMyTurn) {
      // Dark shadow to indicate clickable edge
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = LINE_THICKNESS + 8; // Much thicker for visibility
      
      const { type, x, y } = hoveredLine;
      let start, end;

      if (type === 'H') {
        start = getDotPos(y, x);
        end = getDotPos(y, x + 1);
      } else {
        start = getDotPos(y, x);
        end = getDotPos(y + 1, x);
      }
      
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }

    // 6. Draw Dots (Top layer)
    ctx.fillStyle = '#a0a0a0';
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const pos = getDotPos(r, c);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, DOT_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }
    }

  }, [gameState, hoveredLine, isMyTurn, playerNum, recentLines]);

  // Detect newly placed lines and add animation
  useEffect(() => {
    if (!gameState) return;
    if (!prevGameStateRef.current) {
      prevGameStateRef.current = gameState;
      return;
    }
    
    const prev = prevGameStateRef.current;
    const curr = gameState;
    const newLines: Array<{type: 'H'|'V', x: number, y: number, player: number}> = [];

    // Check horizontal lines
    for (let r = 0; r < curr.board.horizontal.length; r++) {
      for (let c = 0; c < curr.board.horizontal[r].length; c++) {
        if (curr.board.horizontal[r][c] === 1 && prev.board.horizontal[r][c] === 0) {
          newLines.push({ type: 'H', x: c, y: r, player: prev.turn }); // prev.turn is who just played
        }
      }
    }

    // Check vertical lines
    for (let r = 0; r < curr.board.vertical.length; r++) {
      for (let c = 0; c < curr.board.vertical[r].length; c++) {
        if (curr.board.vertical[r][c] === 1 && prev.board.vertical[r][c] === 0) {
          newLines.push({ type: 'V', x: c, y: r, player: prev.turn });
        }
      }
    }

    if (newLines.length > 0) {
      setRecentLines(prev => [...prev, ...newLines]);
      // Remove after 500ms (color animation duration)
      setTimeout(() => {
        setRecentLines(prev => prev.filter(line => !newLines.some(
          nl => nl.type === line.type && nl.x === line.x && nl.y === line.y
        )));
      }, 500);
    }

    prevGameStateRef.current = curr;
  }, [gameState]);


  // Interaction Logic
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMyTurn || gameState.game_over) {
      setHoveredLine(null);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    // Scale mouse coordinates to internal canvas resolution (600x600)
    const scaleX = CANVAS_SIZE / rect.width;
    const scaleY = CANVAS_SIZE / rect.height;
    
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    // Find closest line with improved hit detection for edges
    const threshold = 50; // Larger hitbox for easier clicking
    let found: LineCoordinates | null = null;
    let minDistance = threshold;

    // Check Horizontal Lines (using actual board array dimensions)
    const hRows = gameState.board.horizontal.length;
    const hCols = gameState.board.horizontal[0]?.length || 0;
    for (let r = 0; r < hRows; r++) {
      for (let c = 0; c < hCols; c++) {
        if (gameState.board.horizontal[r][c] === 1) continue; // Already taken

        const start = getDotPos(r, c);
        const end = getDotPos(r, c + 1);
        
        // Distance to line segment (not just midpoint)
        const lineX = Math.max(start.x, Math.min(mouseX, end.x));
        const lineY = start.y;
        const dx = mouseX - lineX;
        const dy = mouseY - lineY;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < minDistance) {
            minDistance = dist;
            found = { type: 'H', x: c, y: r };
        }
      }
    }

    // Check Vertical Lines (using actual board array dimensions)
    const vRows = gameState.board.vertical.length;
    const vCols = gameState.board.vertical[0]?.length || 0;
    for (let r = 0; r < vRows; r++) {
        for (let c = 0; c < vCols; c++) {
          if (gameState.board.vertical[r][c] === 1) continue;
  
          const start = getDotPos(r, c);
          const end = getDotPos(r + 1, c);
          
          // Distance to line segment (not just midpoint)
          const lineX = start.x;
          const lineY = Math.max(start.y, Math.min(mouseY, end.y));
          const dx = mouseX - lineX;
          const dy = mouseY - lineY;
          const dist = Math.sqrt(dx*dx + dy*dy);
  
          if (dist < minDistance) {
              minDistance = dist;
              found = { type: 'V', x: c, y: r };
          }
        }
      }

      setHoveredLine(found);
  };

  const handleMouseLeave = () => {
    setHoveredLine(null);
  };

  const handleClick = () => {
    if (hoveredLine && isMyTurn && !gameState.game_over) {
      gameService.sendMessage({
        op: 'PLACE_LINE',
        x: hoveredLine.x,
        y: hoveredLine.y,
        orientation: hoveredLine.type
      });
      setHoveredLine(null); // Clear immediate to prevent double click visual glitch
    }
  };

  return (
    <div className="relative w-full max-w-[500px] aspect-square mx-auto bg-white rounded-3xl shadow-xl p-4">
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        className="w-full h-full touch-none"
        style={{ 
          cursor: (hoveredLine && isMyTurn && !gameState.game_over) ? 'pointer' : 'default',
          touchAction: 'none' // Prevent scrolling on mobile while touching canvas
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      />
    </div>
  );
};

export default GameBoard;