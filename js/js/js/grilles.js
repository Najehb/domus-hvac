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
        const configs = this.getConfigs();
        const filtered = configs.filter(c => c.id !== configId);
        this.saveConfigs(filtered);
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
        
        if (configs.length === 0) {
            container.innerHTML = '<p style="padding: 20px; text-align: center; color: #999;">No hay configuraciones de rejillas</p>';
            return;
        }
        
        let html = `
            <table class="config-table">
                <thead>
                    <tr>
                        <th>Nivel</th>
                        <th>Retorno (Inst/Total)</th>
                        <th>Suministro (Inst/Total)</th>
                        <th>Total Pendientes</th>
                        <th>Progreso</th>
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
            
            document.querySelector('#grilles .config-form').scrollIntoView({ behavior: 'smooth' });
        }
    },
    
    // Actualizar resumen
    updateSummary: function() {
        const stats = this.getStats();
        
        document.getElementById('totalGrilles').textContent = stats.total;
        document.getElementById('installedGrilles').textContent = stats.installed;
        document.getElementById('pendingGrilles').textContent = stats.pending;
        document.getElementById('grilleProgress').style.width = stats.percent + '%';
        document.getElementById('grillePercent').textContent = stats.percent + '%';
        
        document.getElementById('returnInstalled').textContent = stats.returnInstalled;
        document.getElementById('returnTotal').textContent = stats.returnTotal;
        document.getElementById('supplyInstalled').textContent = stats.supplyInstalled;
        document.getElementById('supplyTotal').textContent = stats.supplyTotal;
        
        // Actualizar dashboard
        document.getElementById('dashTotalGrilles').textContent = stats.total;
        document.getElementById('dashInstalledGrilles').textContent = stats.installed;
        document.getElementById('dashPendingGrilles').textContent = stats.pending;
        document.getElementById('dashGrillePercent').textContent = stats.percent + '%';
        document.getElementById('dashGrilleBar').style.width = stats.percent + '%';
    },
    
    // Inicializar
    init: function() {
        const levels = ['Lobby'];
        for (let i = 2; i <= 13; i++) {
            levels.push(`Nivel ${i}`);
        }
        
        const select = document.getElementById('grilleLevel');
        levels.forEach(level => {
            const option = document.createElement('option');
            option.value = level;
            option.textContent = level;
            select.appendChild(option);
        });
        
        this.updateSummary();
        this.renderTable();
    }
};