class FloorPlanGenerator {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.generateFloorPlan(); // İlk yüklemede plan oluştur
    }

    initializeElements() {
        this.elements = {
            projectName: document.getElementById('projectName'),
            apartmentType: document.getElementById('apartmentType'),
            totalArea: document.getElementById('totalArea'),
            areaSlider: document.getElementById('areaSlider'),
            streetFacing: document.getElementById('streetFacing'),
            generateBtn: document.getElementById('generateBtn'),
            projectInfo: document.getElementById('projectInfo'),
            projectTitle: document.getElementById('projectTitle'),
            projectSpecs: document.getElementById('projectSpecs'),
            floorPlan: document.getElementById('floorPlan'),
            roomDetails: document.getElementById('roomDetails'),
            summaryArea: document.getElementById('summaryArea'),
            summaryRooms: document.getElementById('summaryRooms'),
            livableArea: document.getElementById('livableArea'),
            downloadBtn: document.getElementById('downloadBtn'),
            printBtn: document.getElementById('printBtn')
        };
    }

    attachEventListeners() {
        // Form değişikliklerini dinle
        this.elements.projectName.addEventListener('input', () => this.updateProjectInfo());
        this.elements.apartmentType.addEventListener('change', () => this.generateFloorPlan());
        this.elements.totalArea.addEventListener('input', () => this.syncAreaInputs());
        this.elements.areaSlider.addEventListener('input', () => this.syncAreaSlider());
        this.elements.streetFacing.addEventListener('change', () => this.generateFloorPlan());
        
        // Butonlar
        this.elements.generateBtn.addEventListener('click', () => this.generateFloorPlan());
        this.elements.downloadBtn.addEventListener('click', () => this.downloadPlan());
        this.elements.printBtn.addEventListener('click', () => this.printPlan());
    }

    syncAreaInputs() {
        const value = this.elements.totalArea.value;
        this.elements.areaSlider.value = value;
        this.generateFloorPlan();
    }

    syncAreaSlider() {
        const value = this.elements.areaSlider.value;
        this.elements.totalArea.value = value;
        this.generateFloorPlan();
    }

    updateProjectInfo() {
        const projectName = this.elements.projectName.value.trim();
        if (projectName) {
            this.elements.projectInfo.classList.remove('hidden');
            this.elements.projectTitle.textContent = projectName;
            this.updateProjectSpecs();
        } else {
            this.elements.projectInfo.classList.add('hidden');
        }
    }

    updateProjectSpecs() {
        const apartmentType = this.elements.apartmentType.value;
        const totalArea = this.elements.totalArea.value;
        const streetFacing = this.elements.streetFacing.value;
        
        this.elements.projectSpecs.textContent = 
            `Daire Tipi: ${apartmentType} | Toplam Alan: ${totalArea} m² | Cephe: ${streetFacing} yön`;
    }

    getRoomConfiguration(apartmentType) {
        const configurations = {
            '1+0': { bedrooms: 1, livingRoom: true, bathrooms: 1, kitchen: true },
            '1+1': { bedrooms: 1, livingRoom: true, bathrooms: 1, kitchen: true },
            '2+1': { bedrooms: 2, livingRoom: true, bathrooms: 1, kitchen: true },
            '3+1': { bedrooms: 3, livingRoom: true, bathrooms: 2, kitchen: true },
            '4+1': { bedrooms: 4, livingRoom: true, bathrooms: 2, kitchen: true },
            '5+1': { bedrooms: 5, livingRoom: true, bathrooms: 3, kitchen: true }
        };
        return configurations[apartmentType] || configurations['2+1'];
    }

    calculateRoomAreas(totalArea, roomConfig) {
        const { bedrooms, bathrooms } = roomConfig;
        
        // Alan dağılım oranları - daha gerçekçi
        const livingRoomRatio = Math.max(0.25, 0.4 - (bedrooms * 0.02)); // Yatak odası sayısına göre azal
        const bedroomRatio = (0.5 - (bathrooms * 0.05)) / bedrooms; // Banyo sayısına göre ayarla
        const kitchenRatio = Math.min(0.15, 0.1 + (totalArea / 1000)); // Alan büyüdükçe mutfak oranı artır
        const bathroomRatio = (0.25 - livingRoomRatio - (bedroomRatio * bedrooms) - kitchenRatio) / bathrooms;
        
        return {
            livingRoom: Math.round(totalArea * livingRoomRatio),
            bedroom: Math.round(totalArea * bedroomRatio),
            kitchen: Math.round(totalArea * kitchenRatio),
            bathroom: Math.round(totalArea * bathroomRatio)
        };
    }

    generateRooms() {
        const apartmentType = this.elements.apartmentType.value;
        const totalArea = parseInt(this.elements.totalArea.value) || 75;
        const streetFacing = parseInt(this.elements.streetFacing.value) || 1;
        
        const roomConfig = this.getRoomConfiguration(apartmentType);
        const areas = this.calculateRoomAreas(totalArea, roomConfig);
        
        // SVG boyutları - alan büyüklüğüne göre ölçekle
        const baseSize = 400;
        const scale = Math.sqrt(totalArea / 100);
        const width = baseSize * Math.min(scale, 1.5);
        const height = baseSize * 0.75 * Math.min(scale, 1.5);
        
        const rooms = [];
        const isCorner = streetFacing >= 2;
        
        if (isCorner) {
            rooms.push(...this.generateCornerLayout(width, height, roomConfig, areas));
        } else {
            rooms.push(...this.generateSingleFacadeLayout(width, height, roomConfig, areas));
        }
        
        return { rooms, width, height };
    }

    generateCornerLayout(width, height, roomConfig, areas) {
        const rooms = [];
        
        // Salon (sol alt köşe - büyük alan)
        const livingW = width * 0.55;
        const livingH = height * 0.5;
        rooms.push({
            type: 'Salon',
            x: 0,
            y: height - livingH,
            width: livingW,
            height: livingH,
            area: areas.livingRoom,
            color: '#e3f2fd',
            class: 'salon'
        });
        
        // Mutfak (sağ alt)
        const kitchenW = width - livingW;
        const kitchenH = height * 0.35;
        rooms.push({
            type: 'Mutfak',
            x: livingW,
            y: height - kitchenH,
            width: kitchenW,
            height: kitchenH,
            area: areas.kitchen,
            color: '#e8f5e8',
            class: 'kitchen'
        });
        
        // Yatak odaları (üst sıra)
        const bedroomW = width / roomConfig.bedrooms;
        for (let i = 0; i < roomConfig.bedrooms; i++) {
            rooms.push({
                type: roomConfig.bedrooms === 1 ? 'Yatak Odası' : `Yatak Odası ${i + 1}`,
                x: i * bedroomW,
                y: 0,
                width: bedroomW,
                height: height * 0.4,
                area: areas.bedroom,
                color: '#f3e5f5',
                class: 'bedroom'
            });
        }
        
        // Banyolar (sağ orta)
        const bathroomH = (height - kitchenH) / roomConfig.bathrooms;
        for (let i = 0; i < roomConfig.bathrooms; i++) {
            rooms.push({
                type: roomConfig.bathrooms === 1 ? 'Banyo' : `Banyo ${i + 1}`,
                x: livingW,
                y: height * 0.4 + (i * bathroomH),
                width: kitchenW,
                height: bathroomH,
                area: areas.bathroom,
                color: '#fff3e0',
                class: 'bathroom'
            });
        }
        
        return rooms;
    }

    generateSingleFacadeLayout(width, height, roomConfig, areas) {
        const rooms = [];
        
        // Salon (merkez)
        const livingW = width * 0.5;
        const livingH = height * 0.55;
        rooms.push({
            type: 'Salon',
            x: width * 0.25,
            y: height * 0.25,
            width: livingW,
            height: livingH,
            area: areas.livingRoom,
            color: '#e3f2fd',
            class: 'salon'
        });
        
        // Mutfak (sol alt)
        const kitchenW = width * 0.25;
        const kitchenH = height * 0.3;
        rooms.push({
            type: 'Mutfak',
            x: 0,
            y: height - kitchenH,
            width: kitchenW,
            height: kitchenH,
            area: areas.kitchen,
            color: '#e8f5e8',
            class: 'kitchen'
        });
        
        // Yatak odaları (sağ sütun)
        const bedroomW = width * 0.25;
        const bedroomH = height / roomConfig.bedrooms;
        for (let i = 0; i < roomConfig.bedrooms; i++) {
            rooms.push({
                type: roomConfig.bedrooms === 1 ? 'Yatak Odası' : `Yatak Odası ${i + 1}`,
                x: width * 0.75,
                y: i * bedroomH,
                width: bedroomW,
                height: bedroomH,
                area: areas.bedroom,
                color: '#f3e5f5',
                class: 'bedroom'
            });
        }
        
        // Banyolar (sol üst)
        const bathroomH = (height - kitchenH) / roomConfig.bathrooms;
        for (let i = 0; i < roomConfig.bathrooms; i++) {
            rooms.push({
                type: roomConfig.bathrooms === 1 ? 'Banyo' : `Banyo ${i + 1}`,
                x: 0,
                y: i * bathroomH,
                width: kitchenW,
                height: bathroomH,
                area: areas.bathroom,
                color: '#fff3e0',
                class: 'bathroom'
            });
        }
        
        return rooms;
    }

    generateFloorPlan() {
        const { rooms, width, height } = this.generateRooms();
        this.drawFloorPlan(rooms, width, height);
        this.updateRoomDetails(rooms);
        this.updateSummary(rooms);
        this.updateProjectInfo();
        
        // Animasyon ekle
        this.elements.floorPlan.classList.add('fade-in');
        setTimeout(() => {
            this.elements.floorPlan.classList.remove('fade-in');
        }, 500);
    }

    drawFloorPlan(rooms, width, height) {
        const svg = this.elements.floorPlan;
        svg.innerHTML = ''; // Temizle
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        
        // Arka plan
        const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        background.setAttribute('width', width);
        background.setAttribute('height', height);
        background.setAttribute('fill', '#f8f9fa');
        background.setAttribute('stroke', '#dee2e6');
        background.setAttribute('stroke-width', '2');
        svg.appendChild(background);
        
        // Odaları çiz
        rooms.forEach((room, index) => {
            this.drawRoom(svg, room, index);
        });
        
        // Kuzey işareti ekle
        this.drawNorthArrow(svg, width, height);
        
        // Ölçek çizgisi ekle
        this.drawScale(svg, width, height);
    }

    drawRoom(svg, room, index) {
        // Oda grubu oluştur
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', `room-group ${room.class}`);
        
        // Oda dikdörtgeni
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', room.x);
        rect.setAttribute('y', room.y);
        rect.setAttribute('width', room.width);
        rect.setAttribute('height', room.height);
        rect.setAttribute('fill', room.color);
        rect.setAttribute('stroke', '#2c3e50');
        rect.setAttribute('stroke-width', '2');
        rect.setAttribute('class', 'room-rect');
        rect.setAttribute('data-room-index', index);
        
        // Hover efekti için event listener
        rect.addEventListener('mouseenter', (e) => {
            e.target.setAttribute('stroke-width', '3');
            e.target.setAttribute('filter', 'brightness(0.9)');
        });
        
        rect.addEventListener('mouseleave', (e) => {
            e.target.setAttribute('stroke-width', '2');
            e.target.removeAttribute('filter');
        });
        
        group.appendChild(rect);
        
        // Oda ismi
        const nameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        nameText.setAttribute('x', room.x + room.width / 2);
        nameText.setAttribute('y', room.y + room.height / 2 - 8);
        nameText.setAttribute('text-anchor', 'middle');
        nameText.setAttribute('class', 'room-text');
        nameText.setAttribute('font-size', Math.min(14, room.width / 8));
        nameText.setAttribute('fill', '#2c3e50');
        nameText.setAttribute('font-weight', 'bold');
        nameText.textContent = room.type;
        group.appendChild(nameText);
        
        // Alan bilgisi
        const areaText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        areaText.setAttribute('x', room.x + room.width / 2);
        areaText.setAttribute('y', room.y + room.height / 2 + 10);
        areaText.setAttribute('text-anchor', 'middle');
        areaText.setAttribute('class', 'room-area-text');
        areaText.setAttribute('font-size', Math.min(12, room.width / 10));
        areaText.setAttribute('fill', '#666');
        areaText.textContent = `${room.area} m²`;
        group.appendChild(areaText);
        
        // Boyut bilgileri (küçük odalar için sadece alan göster)
        if (room.width > 60 && room.height > 40) {
            const dimensionText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            dimensionText.setAttribute('x', room.x + room.width / 2);
            dimensionText.setAttribute('y', room.y + room.height / 2 + 25);
            dimensionText.setAttribute('text-anchor', 'middle');
            dimensionText.setAttribute('font-size', '10');
            dimensionText.setAttribute('fill', '#999');
            dimensionText.textContent = `${Math.round(room.width/15)}m × ${Math.round(room.height/15)}m`;
            group.appendChild(dimensionText);
        }
        
        svg.appendChild(group);
    }

    drawNorthArrow(svg, width, height) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('transform', `translate(${width - 50}, 40)`);
        
        // Çember
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', '0');
        circle.setAttribute('cy', '0');
        circle.setAttribute('r', '20');
        circle.setAttribute('fill', '#fff');
        circle.setAttribute('stroke', '#2c3e50');
        circle.setAttribute('stroke-width', '2');
        group.appendChild(circle);
        
        // Ok
        const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        arrow.setAttribute('d', 'M 0,-15 L 6,5 L 0,2 L -6,5 Z');
        arrow.setAttribute('fill', '#e74c3c');
        group.appendChild(arrow);
        
        // N harfi
        const nText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        nText.setAttribute('x', '0');
        nText.setAttribute('y', '35');
        nText.setAttribute('text-anchor', 'middle');
        nText.setAttribute('font-size', '12');
        nText.setAttribute('font-weight', 'bold');
        nText.setAttribute('fill', '#2c3e50');
        nText.textContent = 'K';
        group.appendChild(nText);
        
        svg.appendChild(group);
    }

    drawScale(svg, width, height) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('transform', `translate(20, ${height - 30})`);
        
        // Ölçek çizgisi (5m temsili)
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', '0');
        line.setAttribute('y1', '0');
        line.setAttribute('x2', '75'); // 5m = 75px
        line.setAttribute('y2', '0');
        line.setAttribute('stroke', '#2c3e50');
        line.setAttribute('stroke-width', '2');
        group.appendChild(line);
        
        // Sol dikey çizgi
        const leftTick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        leftTick.setAttribute('x1', '0');
        leftTick.setAttribute('y1', '-5');
        leftTick.setAttribute('x2', '0');
        leftTick.setAttribute('y2', '5');
        leftTick.setAttribute('stroke', '#2c3e50');
        leftTick.setAttribute('stroke-width', '2');
        group.appendChild(leftTick);
        
        // Sağ dikey çizgi
        const rightTick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        rightTick.setAttribute('x1', '75');
        rightTick.setAttribute('y1', '-5');
        rightTick.setAttribute('x2', '75');
        rightTick.setAttribute('y2', '5');
        rightTick.setAttribute('stroke', '#2c3e50');
        rightTick.setAttribute('stroke-width', '2');
        group.appendChild(rightTick);
        
        // Ölçek metni
        const scaleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        scaleText.setAttribute('x', '37.5');
        scaleText.setAttribute('y', '-10');
        scaleText.setAttribute('text-anchor', 'middle');
        scaleText.setAttribute('font-size', '10');
        scaleText.setAttribute('fill', '#2c3e50');
        scaleText.textContent = '5m';
        group.appendChild(scaleText);
        
        svg.appendChild(group);
    }

    updateRoomDetails(rooms) {
        const container = this.elements.roomDetails;
        container.innerHTML = '';
        
        rooms.forEach((room, index) => {
            const roomCard = document.createElement('div');
            roomCard.className = `room-card ${room.class} slide-in`;
            roomCard.style.animationDelay = `${index * 0.1}s`;
            
            roomCard.innerHTML = `
                <h4><i class="fas ${this.getRoomIcon(room.type)}"></i> ${room.type}</h4>
                <div class="room-area">${room.area} m²</div>
                <div class="room-dimensions">
                    Boyutlar: ${Math.round(room.width/15)}m × ${Math.round(room.height/15)}m
                </div>
            `;
            
            container.appendChild(roomCard);
        });
    }

    getRoomIcon(roomType) {
        if (roomType.includes('Salon')) return 'fa-couch';
        if (roomType.includes('Yatak')) return 'fa-bed';
        if (roomType.includes('Mutfak')) return 'fa-utensils';
        if (roomType.includes('Banyo')) return 'fa-shower';
        return 'fa-door-open';
    }

    updateSummary(rooms) {
        const totalArea = parseInt(this.elements.totalArea.value) || 75;
        const totalRooms = rooms.length;
        
        // Yaşanabilir alan hesaplama (banyolar hariç)
        const livableArea = rooms
            .filter(room => !room.type.includes('Banyo'))
            .reduce((sum, room) => sum + room.area, 0);
        
        this.elements.summaryArea.textContent = `${totalArea} m²`;
        this.elements.summaryRooms.textContent = totalRooms;
        this.elements.livableArea.textContent = `${livableArea} m²`;
    }

    downloadPlan() {
        const svg = this.elements.floorPlan;
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        // Canvas boyutlarını ayarla
        canvas.width = 800;
        canvas.height = 600;
        
        img.onload = () => {
            // Beyaz arka plan
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // SVG'yi çiz
            ctx.drawImage(img, 0, 0);
            
            // Proje bilgilerini ekle
 
