import React, { useState, useEffect } from 'react';
import { Download, Home, Settings } from 'lucide-react';

const FloorPlanGenerator = () => {
  const [projectName, setProjectName] = useState('');
  const [roomConfig, setRoomConfig] = useState('2+1');
  const [totalM2, setTotalM2] = useState(100);
  const [roadFaces, setRoadFaces] = useState(1);
  const [floorPlan, setFloorPlan] = useState(null);

  // PWA manifest ve service worker setup
  useEffect(() => {
    // PWA için manifest
    const manifest = {
      name: 'Kat Planı Oluşturucu',
      short_name: 'KatPlani',
      description: 'Dinamik mimari kat planı oluşturma uygulaması',
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#3b82f6',
      icons: [
        {
          src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iOTYiIGN5PSI5NiIgcj0iOTYiIGZpbGw9IiMzYjgyZjYiLz48cGF0aCBkPSJNNDggNjRoOTZ2NjRINDhWNjR6IiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==',
          sizes: '192x192',
          type: 'image/svg+xml'
        }
      ]
    };
    
    const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
    const manifestURL = URL.createObjectURL(manifestBlob);
    
    let manifestLink = document.querySelector('link[rel="manifest"]');
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }
    manifestLink.href = manifestURL;

    return () => URL.revokeObjectURL(manifestURL);
  }, []);

  const calculateRoomSizes = (config, totalArea) => {
    const baseRooms = {
      '1+1': { salon: 0.4, yatak1: 0.25, mutfak: 0.15, banyo: 0.1, koridor: 0.1 },
      '2+1': { salon: 0.35, yatak1: 0.2, yatak2: 0.15, mutfak: 0.15, banyo: 0.08, koridor: 0.07 },
      '3+1': { salon: 0.3, yatak1: 0.18, yatak2: 0.15, yatak3: 0.12, mutfak: 0.12, banyo: 0.08, koridor: 0.05 },
      '4+1': { salon: 0.25, yatak1: 0.16, yatak2: 0.14, yatak3: 0.12, yatak4: 0.1, mutfak: 0.12, banyo: 0.08, koridor: 0.03 }
    };

    const ratios = baseRooms[config] || baseRooms['2+1'];
    const rooms = {};
    
    Object.keys(ratios).forEach(room => {
      rooms[room] = Math.round(totalArea * ratios[room]);
    });

    return rooms;
  };

  const generateFloorPlan = () => {
    const rooms = calculateRoomSizes(roomConfig, totalM2);
    const plan = createFloorPlanSVG(rooms, roadFaces);
    setFloorPlan(plan);
  };

  const createFloorPlanSVG = (rooms, faces) => {
    const width = 800;
    const height = 600;
    const margin = 40;
    
    // Yol cephesi sayısına göre genel şekil
    let buildingWidth, buildingHeight;
    if (faces === 1) {
      buildingWidth = width - 2 * margin;
      buildingHeight = height - 2 * margin;
    } else if (faces === 2) {
      buildingWidth = width - 2 * margin;
      buildingHeight = height - 2 * margin - 50;
    } else {
      buildingWidth = width - 2 * margin - 60;
      buildingHeight = height - 2 * margin - 60;
    }

    const roomElements = [];
    const roomNames = Object.keys(rooms);
    const totalRooms = roomNames.length;

    // Grid hesaplama
    const cols = Math.ceil(Math.sqrt(totalRooms));
    const rows = Math.ceil(totalRooms / cols);
    
    const cellWidth = buildingWidth / cols;
    const cellHeight = buildingHeight / rows;

    let roomIndex = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (roomIndex >= totalRooms) break;
        
        const roomName = roomNames[roomIndex];
        const roomArea = rooms[roomName];
        
        // Oda boyutunu alana göre ayarla
        const areaRatio = Math.sqrt(roomArea / 25); // 25m2 referans
        const roomWidth = Math.min(cellWidth * 0.9, cellWidth * areaRatio * 0.8 + cellWidth * 0.3);
        const roomHeight = Math.min(cellHeight * 0.9, cellHeight * areaRatio * 0.8 + cellHeight * 0.3);
        
        const x = margin + col * cellWidth + (cellWidth - roomWidth) / 2;
        const y = margin + row * cellHeight + (cellHeight - roomHeight) / 2;

        // Oda rengini belirle
        const roomColors = {
          salon: '#e0f2fe',
          mutfak: '#fff3e0',
          banyo: '#f3e5f5',
          koridor: '#f1f8e9',
          yatak1: '#fff8e1',
          yatak2: '#fce4ec',
          yatak3: '#e8f5e8',
          yatak4: '#fff3e0'
        };

        const color = roomColors[roomName] || '#f5f5f5';

        roomElements.push(
          <g key={roomName}>
            <rect
              x={x}
              y={y}
              width={roomWidth}
              height={roomHeight}
              fill={color}
              stroke="#333"
              strokeWidth="2"
              rx="4"
            />
            <text
              x={x + roomWidth / 2}
              y={y + roomHeight / 2 - 10}
              textAnchor="middle"
              className="text-sm font-semibold"
              fill="#333"
            >
              {roomName.charAt(0).toUpperCase() + roomName.slice(1)}
            </text>
            <text
              x={x + roomWidth / 2}
              y={y + roomHeight / 2 + 8}
              textAnchor="middle"
              className="text-xs"
              fill="#666"
            >
              {roomArea}m²
            </text>
          </g>
        );

        roomIndex++;
      }
    }

    // Yol cephesi gösterimi
    const roadElements = [];
    if (faces >= 1) {
      roadElements.push(
        <rect key="road1" x={margin - 20} y={height - 30} width={buildingWidth + 40} height={20} fill="#666" />
      );
    }
    if (faces >= 2) {
      roadElements.push(
        <rect key="road2" x={10} y={margin} width={20} height={buildingHeight} fill="#666" />
      );
    }
    if (faces >= 3) {
      roadElements.push(
        <rect key="road3" x={margin - 20} y={10} width={buildingWidth + 40} height={20} fill="#666" />
      );
    }

    return (
      <svg width={width} height={height} className="border border-gray-300 bg-white rounded-lg">
        {/* Yollar */}
        {roadElements}
        
        {/* Ana bina çerçevesi */}
        <rect
          x={margin}
          y={margin}
          width={buildingWidth}
          height={buildingHeight}
          fill="none"
          stroke="#000"
          strokeWidth="3"
        />
        
        {/* Odalar */}
        {roomElements}
        
        {/* Başlık */}
        <text x={width/2} y={25} textAnchor="middle" className="text-lg font-bold" fill="#333">
          {projectName || 'Kat Planı'} - {roomConfig} ({totalM2}m²)
        </text>
      </svg>
    );
  };

  const downloadSVG = () => {
    if (!floorPlan) return;
    
    const svgElement = document.querySelector('svg');
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName || 'kat-plani'}.svg`;
    a.click();
    
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Home className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">Dinamik Kat Planı Oluşturucu</h1>
          </div>
          
          {/* Form Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proje Adı
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Proje adını girin"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Oda Konfigürasyonu
              </label>
              <select
                value={roomConfig}
                onChange={(e) => setRoomConfig(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="1+1">1+1</option>
                <option value="2+1">2+1</option>
                <option value="3+1">3+1</option>
                <option value="4+1">4+1</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Toplam M² ({totalM2}m²)
              </label>
              <input
                type="range"
                min="50"
                max="300"
                value={totalM2}
                onChange={(e) => setTotalM2(parseInt(e.target.value))}
                className="w-full"
              />
              <input
                type="number"
                min="50"
                max="300"
                value={totalM2}
                onChange={(e) => setTotalM2(parseInt(e.target.value))}
                className="w-full mt-1 px-3 py-1 border border-gray-300 rounded text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Yol Cephesi Sayısı
              </label>
              <select
                value={roadFaces}
                onChange={(e) => setRoadFaces(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={1}>1 Cephe</option>
                <option value={2}>2 Cephe</option>
                <option value={3}>3+ Cephe</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={generateFloorPlan}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Settings className="w-5 h-5" />
              Kat Planı Oluştur
            </button>
            
            {floorPlan && (
              <button
                onClick={downloadSVG}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <Download className="w-5 h-5" />
                SVG İndir
              </button>
            )}
          </div>
        </div>

        {/* Floor Plan Display */}
        {floorPlan && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Kat Planı Önizlemesi</h2>
            <div className="flex justify-center">
              {floorPlan}
            </div>
            
            {/* Oda Bilgileri */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {Object.entries(calculateRoomSizes(roomConfig, totalM2)).map(([room, area]) => (
                <div key={room} className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="font-medium text-gray-800 capitalize">{room}</div>
                  <div className="text-sm text-gray-600">{area}m²</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PWA Install Prompt */}
        <div className="mt-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">📱 Mobil Uygulama Olarak Kaydet</h3>
          <p className="text-sm opacity-90">
            Bu uygulamayı ana ekranınıza ekleyerek PWA olarak kullanabilirsiniz. 
            Tarayıcınızın "Ana ekrana ekle" seçeneğini kullanın.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FloorPlanGenerator;
