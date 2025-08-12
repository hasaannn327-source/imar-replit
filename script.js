class FloorPlanGenerator {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.initializePWA();
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

    initializePWA() {
        // PWA yükleme banner'ı için event listener
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            this.showInstallBanner();
        });

        // PWA yükleme butonları
        const installBtn = document.getElementById('pwaInstallBtn');
        const closeBtn = document.getElementById('pwaCloseBtn');
        
        if (installBtn) {
            installBtn.addEventListener('click', async () => {
                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    console.log(`User response: ${outcome}`);
                    deferredPrompt = null;
                    this.hideInstallBanner();
                }
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideInstallBanner();
            });
        }
    }

    showInstallBanner() {
        const banner = document.getElementById('pwaInstallBanner');
        if (banner) {
            banner.classList.remove('hidden');
        }
    }

    hideInstallBanner() {
        const banner = document.getElementById('pwaInstallBanner');
        if (banner) {
            banner.classList.add('hidden');
        }
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
            '1+0': { bedrooms: 0, livingRoom: true, bathrooms: 1, kitchen: true },
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
        
        // Alan dağılım oranları - daha gerçekçi hesaplama
        let livingRoomRatio = 0.35; // %35 salon
        let kitchenRatio = 0.12; // %12 mutfak
        let bathroomRatio = 0.08; // Her banyo için %8
        
        // Kalan alan yatak odalarına
        const totalFixedRatio = livingRoomRatio + kitchenRatio + (bathroomRatio * bathrooms);
        const remainingRatio = 1 - totalFixedRatio;
        const bedroomRatio = bedrooms > 0 ? remainingRatio / bedrooms : 0;
        
        // Alan hesaplamaları
        const livingRoomArea = Math.max(12, Math.round(totalArea * livingRoomRatio));
        const kitchenArea = Math.max(6, Math.round(totalArea * kitchenRatio));
        const bathroomArea = Math.max(3, Math.round(totalArea * bathroomRatio));
        const bedroomArea = bedrooms > 0 ? Math.max(8, Math.round(totalArea * bedroomRatio)) : 0;
        
        // Toplam alan kontrolü ve düzeltme
        const calculatedTotal = livingRoomArea + kitchenArea + (bathroomArea * bathrooms) + (bedroomArea * bedrooms);
        const difference = totalArea - calculatedTotal;
        
        // Farkı salon alanına ekle
        const adjustedLivingRoom = Math.max(12, livingRoomArea + difference);
        
        return {
            livingRoom: adjustedLivingRoom,
            bedroom: bedroomArea,
            kitchen: kitchenArea,
            bathroom: bathroomArea
        };
    }

    generateRooms() {
        const apartmentType = this.elements.apartmentType.value;
        const totalArea = parseInt(this.elements.totalArea.value) || 75;
        const streetFacing = parseInt(this.elements.streetFacing.value) || 1;
        
        const roomConfig = this.getRoomConfiguration(apartmentType);
        const areas = this.calculateRoomAreas(totalArea, roomConfig);
        
        // SVG boyutları
        const width = 600;
        const height = 450;
        
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
        const { bedrooms, bathrooms } = roomConfig;
        
        // Salon (sol alt - en büyük alan)
        const livingW = width * 0.5;
        const livingH = height * 0.55;
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
        const kitchenH = height * 0.3;
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
        
        // Yatak odaları (üst sıra) - sadece yatak odası varsa
        if (bedrooms > 0) {
            const bedroomW = width / bedrooms;
            for (let i = 0; i < bedrooms; i++) {
                rooms.push({
                    type: bedrooms === 1 ? 'Yatak Odası' : `Yatak Odası ${i + 1}`,
                    x: i * bedroomW,
                    y: 0,
                    width: bedroomW,
                    height: height * 0.35,
                    area: areas.bedroom,
                    color: '#f3e5f5',
                    class: 'bedroom'
                });
            }
        }
        
        // Banyolar (sağ orta)
        const availableHeight = height - kitchenH - (bedrooms > 0 ? height * 0.35 : 0);
        const bathroomH = availableHeight / bathrooms;
        for (let i = 0; i < bathrooms; i++) {
            const yPosition = (bedrooms > 0 ? height * 0.35 : 0) + (i * bathroomH);
            rooms.push({
                type: bathrooms === 1 ? 'Banyo' : `Banyo ${i + 1}`,
                x: livingW,
                y: yPosition,
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
        const { bedrooms, bathrooms } = roomConfig;
        
        // Salon (merkez)
        const livingW = width * 0.45;
        const livingH = height * 0.6;
        rooms.push({
            type: 'Salon',
            x: width * 0.3,
            y: height * 0.2,
            width: livingW,
            height: livingH,
            area: areas.livingRoom,
            color: '#e3f2fd',
            class: 'salon'
        });
        
        // Mutfak (sol alt)
        const kitchenW = width * 0.3;
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
        
        // Yatak odaları (sağda) - sadece yatak odası varsa
        if (bedrooms > 0) {
            const bedroomW = width * 0.25;
            const bedroomH = height / bedrooms;
            for (let i = 0; i < bedrooms; i++) {
                rooms.push({
                    type: bedrooms === 1 ? 'Yatak Odası' : `Yatak Odası ${i + 1}`,
                    x: width * 0.75,
                    y: i * bedroomH,
                    width: bedroomW,
                    height: bedroomH,
                    area: areas.bedroom,
                    color: '#f3e5f5',
                    class: 'bedroom'
                });
            }
        }
        
        // Banyolar (sol üst)
        const availableHeight = height - kitchenH;
        const bathroomH = availableHeight / bathrooms;
        for (let i = 0; i < bathrooms; i++) {
            rooms.push({
                type: bathrooms === 1 ? 'Banyo' : `Banyo ${i + 1}`,
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
        
        // Oda ismi - metin boyutunu oda boyutuna göre ayarla
        const fontSize = Math.min(14, Math.max(10, room.width / 12, room.height / 8));
        const nameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        nameText.setAttribute('x', room.x + room.width / 2);
        nameText.setAttribute('y', room.y + room.height / 2 - 8);
        nameText.setAttribute('text-anchor', 'middle');
        nameText.setAttribute('class', 'room-text');
        nameText.setAttribute('font-size', fontSize);
        nameText.setAttribute('fill', '#2c3e50');
        nameText.setAttribute('font-weight', 'bold');
        nameText.textContent = room.type;
        group.appendChild(nameText);
        
        // Alan bilgisi
        const areaFontSize = Math.min(12, Math.max(8, room.width / 15, room.height / 10));
        const areaText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        areaText.setAttribute('x', room.x + room.width / 2);
        areaText.setAttribute('y', room.y + room.height / 2 + 10);
        areaText.setAttribute('text-anchor', 'middle');
        areaText.setAttribute('class', 'room-area-text');
        areaText.setAttribute('font-size', areaFontSize);
        areaText.setAttribute('fill', '#666');
        areaText.textContent = `${room.area} m²`;
        group.appendChild(areaText);
        
        // Boyut bilgileri (yeterince büyük odalar için)
        if (room.width > 80 && room.height > 60) {
            const dimensionText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            dimensionText.setAttribute('x', room.x + room.width / 2);
            dimensionText.setAttribute('y', room.y + room.height / 2 + 25);
            dimensionText.setAttribute('text-anchor', 'middle');
            dimensionText.setAttribute('font-size', '10');
            dimensionText.setAttribute('fill', '#999');
            
            // Yaklaşık boyutları hesapla (1 piksel ≈ 2.5 cm)
            const widthM = Math.round((room.width / 24) * 100) / 100; // 600px = 15m varsayımı
            const heightM = Math.round((room.height / 18) * 100) / 100; // 450px = 12m varsayımı
            dimensionText.textContent = `${widthM}m × ${heightM}m`;
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
        
        // K harfi (Kuzey)
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
        
        // Ölçek çizgisi (2m temsili)
        const scaleLength = 48; // 600px = 15m, o halde 48px = 1.2m ≈ 2m olarak gösterelim
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', '0');
        line.setAttribute('y1', '0');
        line.setAttribute('x2', scaleLength);
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
        rightTick.setAttribute('x1', scaleLength);
        rightTick.setAttribute('y1', '-5');
        rightTick.setAttribute('x2', scaleLength);
        rightTick.setAttribute('y2', '5');
        rightTick.setAttribute('stroke', '#2c3e50');
        rightTick.setAttribute('stroke-width', '2');
        group.appendChild(rightTick);
        
        // Ölçek m
    const scaleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        scaleText.setAttribute('x', scaleLength / 2);
        scaleText.setAttribute('y', '-10');
        scaleText.setAttribute('text-anchor', 'middle');
        scaleText.setAttribute('font-size', '10');
        scaleText.setAttribute('fill', '#2c3e50');
        scaleText.textContent = '2m';
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
            
            // Boyut hesapla (daha doğru hesaplama)
            const roomWidth = Math.round((room.width / 24) * 100) / 100; // 600px = 15m
            const roomHeight = Math.round((room.height / 18) * 100) / 100; // 450px = 12m
            
            roomCard.innerHTML = `
                <h4><i class="fas ${this.getRoomIcon(room.type)}"></i> ${room.type}</h4>
                <div class="room-area">${room.area} m²</div>
                <div class="room-dimensions">
                    Boyutlar: ${roomWidth}m × ${roomHeight}m
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
            ctx.drawImage(img, 50, 80, 700, 450);
            
            // Proje bilgilerini ekle
            ctx.fillStyle = '#2c3e50';
            ctx.font = 'bold 20px Arial';
            ctx.fillText(this.elements.projectName.value || 'Kat Planı', 50, 40);
            
            ctx.font = '14px Arial';
            ctx.fillText(this.elements.projectSpecs.textContent || '', 50, 65);
            
            // Tarih ekle
            ctx.font = '12px Arial';
            ctx.fillText(`Oluşturulma: ${new Date().toLocaleDateString('tr-TR')}`, 50, 580);
            
            // İndir
            const link = document.createElement('a');
            link.download = `${(this.elements.projectName.value || 'kat-plani').replace(/\s+/g, '-')}.png`;
            link.href = canvas.toDataURL();
            link.click();
        };
        
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    }

    printPlan() {
        const printWindow = window.open('', '_blank');
        const svgContent = this.elements.floorPlan.outerHTML;
        const projectName = this.elements.projectName.value || 'Kat Planı';
        const projectSpecs = this.elements.projectSpecs.textContent || '';
        
        printWindow.document.write(`
