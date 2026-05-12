// Módulo de gestión de rejillas
const GrilleManager = {
    // Obtener configuraciones de rejillas
    getConfigs: function() {
        const configs = localStorage.getItem('domus_grilles');
        return configs ? JSON.parse(configs) : [];
    },
    
    // Guardar configuraciones
    saveConfigs: function(configs) {
        localStorage.setItem('domus_grilles', JSON.stringify(configs));
    },
    
    // Generar niveles
    generateLevels: function() {
        const levels = ['Lobby'];
        for (let i = 2; i <= 13; i++) {
            levels.push(`Nivel ${i}`);
        }
        return levels;
    },
    
    // Agregar o actualizar configuración
    saveConfig: function(level, returnTotal, returnInstalled, supplyTotal, supplyInstalled) {
        const configs = this.getConfigs();
        const existingIndex = configs.findIndex(c => c.level === level);
        
        const configData = {
            level: level,
            returnTotal: parseInt(returnTotal),
            returnInstalled: parseInt(returnInstalled),
            supplyTotal: parseInt(supplyTotal),
            supplyInstalled: parseInt(supplyInstalled),
            updatedAt: new Date().toLocaleString()
        };
        
        if (existingIndex >= 0) {
            // Actualizar existente
            configs[existingIndex] = { ...configs[existingIndex], ...configData };
        } else {
            // Agregar nuevo
            configs.push({
                id: Date.now(),
                ...configData,
                createdAt: new Date().toLocaleString()
            });
        }
        
        this.saveConfigs(configs);
        Storage.addLog('configuración', Date.now(), `Rejillas - ${level}`);
    },
    
    // Eliminar configuración
    deleteConfig: function(configId) {
        if (confirm('¿Estás seguro de eliminar esta configuración?')) {
            const configs = this.getConfigs();
            const filtered = configs.filter(c => c.id !== configId);
            this.saveConfigs(filtered);
            this.renderTable();
            this.updateSummary();
            Dashboard.update();
        }
    },
    
    // Obtener estadísticas
    getStats: function() {
        const configs = this.getConfigs();
        
        const returnTotal = configs.reduce((sum, c) => sum + c.returnTotal, 0);
        const returnInstalled = configs.reduce((sum, c) => sum + c.returnInstalled, 0);
        const supplyTotal = configs.reduce((sum, c) => sum + c.supplyTotal, 0);
        const supplyInstalled = configs.reduce((sum, c) => sum + c.supplyInstalled, 0);
        
        const total = returnTotal + supplyTotal;
        const installed = returnInstalled + supplyInstalled;
        const pending = total - installed;
        const percent = total > 0 ? Math.round((installed / total) * 100) : 0;
        
        return {
            total,
            installed,
            pending,
            percent,
            returnTotal,
            returnInstalled,
            supplyTotal,
            supplyInstalled
        };
    },
    
    // Renderizar tabla
    renderTable: function() {
        const configs = this.getConfigs();
        const container = document.getElementById('grilleTable');
        
        if (!container) return;
        
        if (configs.length === 0) {
            container.innerHTML = '<p style="padding: 20px; text-align: center; color: #999;">No hay configuraciones de rejillas. Usa el formulario para agregar la primera configuración.</p>';
            return;
        }
        
        // Ordenar por nivel
        configs.sort((a, b) => {
            if (a.level === 'Lobby') return -1;
            if (b.level === 'Lobby') return 1;
            const numA = parseInt(a.level.replace('Nivel ', ''));
            const numB = parseInt(b.level.replace('Nivel ', ''));
            return numA - numB;
        });
        
        let html = `
            <table class="config-table">
                <thead>
                    <tr>
                        <th>Nivel</th>
                        <th>Retorno (Inst/Total)</th>
                        <th>Suministro (Inst/Total)</th>
                        <th>Total Pendientes</th>
                        <th>Progreso</th>
                        <th>Última Actualización</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        configs.forEach(config => {
            const returnPending = config.returnTotal - config.returnInstalled;
            const supplyPending = config.supplyTotal - config.supplyInstalled;
            const totalPending = returnPending + supplyPending;
            const totalAll = config.returnTotal + config.supplyTotal;
            const totalInstalled = config.returnInstalled + config.supplyInstalled;
            const percent = totalAll > 0 ? Math.round((totalInstalled / totalAll) * 100) : 0;
            const statusClass = totalPending === 0 ? 'status-complete' : 'status-pending';
            
            html += `
                <tr>
                    <td><strong>${config.level}</strong></td>
                    <td>${config.returnInstalled}/${config.returnTotal}</td>
                    <td>${config.supplyInstalled}/${config.supplyTotal}</td>
                    <td class="${statusClass}">${totalPending}</td>
                    <td>
                        <div class="progress-bar" style="height: 15px;">
                            <div class="progress-fill grille-fill" style="width: ${percent}%"></div>
                        </div>
                        <small>${percent}%</small>
                    </td>
                    <td><small>${config.updatedAt}</small></td>
                    <td class="actions">
                        <button class="btn-small btn-edit-config" onclick="GrilleManager.editConfig('${config.level}')">Editar</button>
                        <button class="btn-small btn-delete-config" onclick="GrilleManager.deleteConfig(${config.id})">Eliminar</button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
    },
    
    // Editar configuración
    editConfig: function(level) {
        const configs = this.getConfigs();
        const config = configs.find(c => c.level === level);
        
        if (config) {
            document.getElementById('grilleLevel').value = config.level;
            document.getElementById('grilleTotalReturn').value = config.returnTotal;
            document.getElementById('grilleInstalledReturn').value = config.returnInstalled;
            document.getElementById('grilleTotalSupply').value = config.supplyTotal;
            document.getElementById('grilleInstalledSupply').value = config.supplyInstalled;
            
            // Cambiar a la sección de rejillas si no está activa
            showSection('grilles');
            
            // Scroll al formulario
            setTimeout(() => {
                document.querySelector('#grilles .config-form').scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    },
    
    // Actualizar resumen
    updateSummary: function() {
        const stats = this.getStats();
        
        // Actualizar resumen en la página de rejillas
        const totalGrilles = document.getElementById('totalGrilles');
        const installedGrilles = document.getElementById('installedGrilles');
        const pendingGrilles = document.getElementById('pendingGrilles');
        const grilleProgress = document.getElementById('grilleProgress');
        const grillePercent = document.getElementById('grillePercent');
        const returnInstalled = document.getElementById('returnInstalled');
        const returnTotal = document.getElementById('returnTotal');
        const supplyInstalled = document.getElementById('supplyInstalled');
        const supplyTotal = document.getElementById('supplyTotal');
        
        if (totalGrilles) totalGrilles.textContent = stats.total;
        if (installedGrilles) installedGrilles.textContent = stats.installed;
        if (pendingGrilles) pendingGrilles.textContent = stats.pending;
        if (grilleProgress) grilleProgress.style.width = stats.percent + '%';
        if (grillePercent) grillePercent.textContent = stats.percent + '%';
        if (returnInstalled) returnInstalled.textContent = stats.returnInstalled;
        if (returnTotal) returnTotal.textContent = stats.returnTotal;
        if (supplyInstalled) supplyInstalled.textContent = stats.supplyInstalled;
        if (supplyTotal) supplyTotal.textContent = stats.supplyTotal;
        
        // Actualizar dashboard
        const dashTotalGrilles = document.getElementById('dashTotalGrilles');
        const dashInstalledGrilles = document.getElementById('dashInstalledGrilles');
        const dashPendingGrilles = document.getElementById('dashPendingGrilles');
        const dashGrillePercent = document.getElementById('dashGrillePercent');
        const dashGrilleBar = document.getElementById('dashGrilleBar');
        
        if (dashTotalGrilles) dashTotalGrilles.textContent = stats.total;
        if (dashInstalledGrilles) dashInstalledGrilles.textContent = stats.installed;
        if (dashPendingGrilles) dashPendingGrilles.textContent = stats.pending;
        if (dashGrillePercent) dashGrillePercent.textContent = stats.percent + '%';
        if (dashGrilleBar) dashGrilleBar.style.width = stats.percent + '%';
    },
    
    // Cargar niveles en el select
    loadLevels: function() {
        const select = document.getElementById('grilleLevel');
        if (!select) {
            console.error('No se encontró el elemento grilleLevel');
            return;
        }
        
        // Limpiar opciones existentes
        select.innerHTML = '';
        
        // Agregar opción por defecto
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Seleccionar nivel';
        select.appendChild(defaultOption);
        
        // Generar y agregar niveles
        const levels = this.generateLevels();
        levels.forEach(level => {
            const option = document.createElement('option');
            option.value = level;
            option.textContent = level;
            select.appendChild(option);
        });
        
        console.log('Niveles de rejillas cargados:', levels.length);
    },
    
    // Inicializar
    init: function() {
        this.loadLevels();
        this.updateSummary();
        this.renderTable();
    }
};