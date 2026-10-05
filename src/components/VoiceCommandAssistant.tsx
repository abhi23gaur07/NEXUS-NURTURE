import React, { useState, useEffect, useRef } from 'react';
import { RoomData } from '../types/iot';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  X,
  Radio,
  Send
} from 'lucide-react';

interface VoiceCommandAssistantProps {
  rooms: RoomData[];
  selectedRoomId: string;
  onSelectRoom: (roomId: string) => void;
  onUpdateRoomTemp: (roomId: string, newTemp: number) => void;
  onToggleRoomPower: (roomId: string, forceState?: boolean) => void;
  onUpdateRoomMode: (roomId: string, mode: RoomData['acState']['mode']) => void;
  onUpdateRoomServoAngle: (roomId: string, angle: number) => void;
  onUpdateRoomFanSpeed: (roomId: string, fan: RoomData['acState']['fanSpeed']) => void;
  onOpenSiriModal?: () => void;
}

export const VoiceCommandAssistant: React.FC<VoiceCommandAssistantProps> = ({
  rooms,
  selectedRoomId,
  onSelectRoom,
  onUpdateRoomTemp,
  onToggleRoomPower,
  onUpdateRoomMode,
  onUpdateRoomServoAngle,
  onUpdateRoomFanSpeed,
  onOpenSiriModal,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastActionFeedback, setLastActionFeedback] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isSupported, setIsSupported] = useState(true);
  const [manualInput, setManualInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const recognitionRef = useRef<any>(null);

  // Initialize SpeechRecognition if available
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setIsError(false);
        setTranscript('Listening for command...');
      };

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const text = event.results[current][0].transcript;
        setTranscript(text);
        if (event.results[current].isFinal) {
          processVoiceCommand(text);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error !== 'no-speech') {
          setIsError(true);
          setLastActionFeedback(`Microphone notice: ${event.error}. You can also type commands.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('SpeechRecognition initialization error:', err);
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [rooms, selectedRoomId]);

  const speakFeedback = (text: string) => {
    if (!ttsEnabled || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore audio synthesis errors
    }
  };

  const processVoiceCommand = (commandText: string) => {
    // Strip common Siri prefixes for natural voice commands
    let text = commandText.toLowerCase().trim();
    if (text.startsWith('hey siri')) {
      text = text.replace(/^hey siri[,.]?\s*/, '');
    } else if (text.startsWith('siri')) {
      text = text.replace(/^siri[,.]?\s*/, '');
    }

    setTranscript(commandText);

    // 1. Identify Room target (including 'hall' for Living Room / Main Hall)
    let targetRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0];

    if (text.includes('bedroom') || text.includes('bed')) {
      const found = rooms.find((r) => r.id === 'bedroom');
      if (found) targetRoom = found;
    } else if (text.includes('hall') || text.includes('living') || text.includes('lounge')) {
      const found = rooms.find((r) => r.id === 'living');
      if (found) targetRoom = found;
    } else if (text.includes('study') || text.includes('hub') || text.includes('office') || text.includes('desk')) {
      const found = rooms.find((r) => r.id === 'study');
      if (found) targetRoom = found;
    } else if (text.includes('balcony') || text.includes('patio')) {
      const found = rooms.find((r) => r.id === 'balcony');
      if (found) targetRoom = found;
    }

    // Always focus to target room
    onSelectRoom(targetRoom.id);

    let feedback = '';

    // 2. Power On / Off Commands
    if (
      text.includes('turn off') ||
      text.includes('power off') ||
      text.includes('shut off') ||
      text.includes('switch off') ||
      text.includes('stop ac')
    ) {
      onToggleRoomPower(targetRoom.id, false);
      feedback = `Turned off AC in ${targetRoom.name}.`;
    } else if (
      text.includes('turn on') ||
      text.includes('power on') ||
      text.includes('start ac') ||
      text.includes('switch on') ||
      text.includes('activate ac')
    ) {
      onToggleRoomPower(targetRoom.id, true);
      feedback = `Turned on AC in ${targetRoom.name}.`;
    }
    // 3. Temperature Setting ("set temp to 22", "make it 21 degrees", "temperature 23")
    else if (text.includes('temp') || text.includes('degree') || text.includes('cool to') || text.includes('set to')) {
      const match = text.match(/(\d+(\.\d+)?)/);
      if (match) {
        const val = parseFloat(match[1]);
        if (val >= 16 && val <= 30) {
          onUpdateRoomTemp(targetRoom.id, val);
          feedback = `Set target temperature to ${val}°C in ${targetRoom.name}.`;
        } else {
          feedback = `Requested ${val}°C is outside the safe 16°C–30°C comfort range.`;
        }
      } else {
        feedback = `Could not recognize target degrees. Please say e.g. "set temp to 22".`;
      }
    }
    // 4. Mode Setting ("follow me", "indirect", "eco", "auto")
    else if (text.includes('follow me') || text.includes('follow-me') || text.includes('tracking')) {
      onUpdateRoomMode(targetRoom.id, 'follow-me');
      feedback = `Enabled Follow-Me mmWave tracking mode in ${targetRoom.name}.`;
    } else if (text.includes('indirect') || text.includes('deflect') || text.includes('comfort deflect')) {
      onUpdateRoomMode(targetRoom.id, 'indirect');
      feedback = `Switched to indirect ceiling breeze in ${targetRoom.name}.`;
    } else if (text.includes('eco') || text.includes('energy saver')) {
      onUpdateRoomMode(targetRoom.id, 'eco');
      feedback = `Enabled Eco Presence Gate mode in ${targetRoom.name}.`;
    } else if (text.includes('auto') || text.includes('automatic')) {
      onUpdateRoomMode(targetRoom.id, 'auto');
      feedback = `Switched to Auto Climate Equilibrium in ${targetRoom.name}.`;
    }
    // 5. Fan Speed ("turbo", "quiet", "high", "low", "medium")
    else if (text.includes('turbo') || text.includes('maximum fan')) {
      onUpdateRoomFanSpeed(targetRoom.id, 'turbo');
      feedback = `Set fan speed to Turbo in ${targetRoom.name}.`;
    } else if (text.includes('quiet') || text.includes('silent') || text.includes('sleep fan')) {
      onUpdateRoomFanSpeed(targetRoom.id, 'quiet');
      feedback = `Set fan to Quiet Whisper mode in ${targetRoom.name}.`;
    } else if (text.includes('high fan') || text.includes('fan high')) {
      onUpdateRoomFanSpeed(targetRoom.id, 'high');
      feedback = `Set fan to High in ${targetRoom.name}.`;
    } else if (text.includes('low fan') || text.includes('fan low')) {
      onUpdateRoomFanSpeed(targetRoom.id, 'low');
      feedback = `Set fan to Low in ${targetRoom.name}.`;
    }
    // 6. Servo Angle / Louver Control ("set louver to 45", "angle 30")
    else if (text.includes('louver') || text.includes('servo') || text.includes('angle') || text.includes('vent')) {
      const match = text.match(/(\d+)/);
      if (match) {
        const angle = Math.min(90, Math.max(0, parseInt(match[1])));
        onUpdateRoomServoAngle(targetRoom.id, angle);
        feedback = `Adjusted SG90 servo louvers to ${angle}° in ${targetRoom.name}.`;
      } else {
        feedback = `Understood louver command. Specify angle e.g. "set louvers to 45".`;
      }
    } else {
      feedback = `Heard: "${commandText}". Try: "set temp to 22" or "turn off bedroom AC".`;
    }

    setLastActionFeedback(feedback);
    speakFeedback(feedback);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setIsOpen(true);
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        setIsOpen(true);
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Recognition start error:', err);
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    processVoiceCommand(manualInput);
    setManualInput('');
  };

  const quickPrompts = [
    'Hey Siri, set hall AC to 22',
    'Hey Siri, turn off hall AC',
    'Hey Siri, set mode to follow-me',
    'Set temp to 21 in bedroom',
    'Set louvers to 45 degrees',
    'Turn on study AC',
  ];

  return (
    <>
      {/* Top Floating / Docked Voice Control Capsule */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleListening}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-xs ${
            isListening
              ? 'bg-rose-600 text-white animate-pulse'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
          }`}
          title="Voice Control (Web Speech API)"
        >
          {isListening ? (
            <>
              <Mic className="w-3.5 h-3.5 text-white animate-bounce" />
              <span>Listening...</span>
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5 text-emerald-600" />
              <span>Voice Control</span>
            </>
          )}
        </button>
      </div>

      {/* Voice Assistant Drawer / Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs animate-in fade-in duration-150">
          <div 
            className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  isListening ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Voice Command Interface
                  </h3>
                  <p className="text-xs text-slate-500">
                    Web Speech API · Instant Edge Automation
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setTtsEnabled(!ttsEnabled)}
                  title={ttsEnabled ? 'Mute Speech Responses' : 'Enable Spoken Responses'}
                  className={`p-2 rounded-xl text-xs transition-colors ${
                    ttsEnabled ? 'text-emerald-700 bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => {
                    if (isListening && recognitionRef.current) recognitionRef.current.stop();
                    setIsOpen(false);
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Central Listening State & Waveform Visualizer */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center flex flex-col items-center justify-center min-h-[110px]">
              <button
                onClick={toggleListening}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-95 mb-2 ${
                  isListening
                    ? 'bg-rose-600 text-white ring-4 ring-rose-200 animate-pulse'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {isListening ? <Mic className="w-6 h-6 animate-bounce" /> : <Mic className="w-6 h-6" />}
              </button>

              <div className="text-xs font-semibold text-slate-800">
                {isListening ? 'Speak now... (e.g., "Set temp to 22")' : 'Tap microphone to speak'}
              </div>

              {transcript && (
                <div className="mt-2 text-xs font-mono text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 max-w-full truncate">
                  "{transcript}"
                </div>
              )}
            </div>

            {/* Action Feedback Banner */}
            {lastActionFeedback && (
              <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{lastActionFeedback}</span>
              </div>
            )}

            {/* Quick Command Suggestion Chips */}
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Suggested Commands
              </div>
              <div className="flex flex-wrap gap-1.5">
                {quickPrompts.map((cmd) => (
                  <button
                    key={cmd}
                    onClick={() => processVoiceCommand(cmd)}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  >
                    "{cmd}"
                  </button>
                ))}
              </div>
            </div>

            {/* Apple Home & Siri Shortcuts Bridge Button */}
            {onOpenSiriModal && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenSiriModal();
                }}
                className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>Connect to Apple Home &amp; Siri Shortcuts</span>
                </div>
                <span className="text-[10px] font-mono text-purple-800 bg-purple-200/60 px-1.5 py-0.5 rounded">
                  HomeKit &amp; Matter
                </span>
              </button>
            )}

            {/* Text input fallback for keyboard or unsupported browsers */}
            <form onSubmit={handleManualSubmit} className="pt-2 border-t border-slate-100 flex items-center gap-2">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Or type a voice command..."
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1"
              >
                <span>Send</span>
                <Send className="w-3 h-3" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
