import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eraser } from 'lucide-react';

interface SignaturePadProps {
  onChange: (dataUrl: string) => void;
  initialValue?: string;
  disabled?: boolean;
}

export function SignaturePad({ onChange, initialValue, disabled = false }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!initialValue);
  
  // Inicializa o canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configura o tamanho do canvas para corresponder ao tamanho de exibição
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';

    // Limpa o canvas
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Se houver um valor inicial, desenha-o
    if (initialValue) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        setHasSignature(true);
      };
      img.src = initialValue;
    }
  }, [initialValue]);

  // Handler para começar a desenhar
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();

    // Obter coordenadas
    const coordinates = getCoordinates(e, canvas);
    if (coordinates) {
      ctx.moveTo(coordinates.x, coordinates.y);
    }
  };

  // Handler para desenhar
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Obter coordenadas
    const coordinates = getCoordinates(e, canvas);
    if (coordinates) {
      ctx.lineTo(coordinates.x, coordinates.y);
      ctx.stroke();
      setHasSignature(true);
    }
  };

  // Handler para parar de desenhar
  const stopDrawing = () => {
    if (disabled) return;
    
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (canvas) {
        onChange(canvas.toDataURL());
      }
    }
  };

  // Limpar a assinatura
  const clearSignature = () => {
    if (disabled) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    setHasSignature(false);
    onChange('');
  };

  // Obter coordenadas do mouse ou toque
  const getCoordinates = (
    event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in event) {
      // Evento de toque
      if (event.touches.length > 0) {
        return {
          x: event.touches[0].clientX - rect.left,
          y: event.touches[0].clientY - rect.top
        };
      }
    } else {
      // Evento de mouse
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    }
    
    return null;
  };

  return (
    <div className={`border rounded-md p-2 ${disabled ? 'opacity-80' : ''}`}>
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm text-gray-500">
          {disabled ? 'Assinatura' : 'Assine no espaço abaixo'}
        </p>
        
        {!disabled && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearSignature}
            disabled={!hasSignature}
          >
            <Eraser className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>
      
      <canvas
        ref={canvasRef}
        className={`w-full h-32 border rounded-md bg-white ${disabled ? 'cursor-default' : 'cursor-crosshair'}`}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      
      {!disabled && !hasSignature && (
        <p className="text-xs text-gray-400 mt-1">
          Clique e arraste para assinar
        </p>
      )}
    </div>
  );
}