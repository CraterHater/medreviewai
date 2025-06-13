// js/modules/resultsRenderer.js

/**
 * Creates a single MRP or Intervention card element.
 * This is a private helper function for this module.
 */
function createCard(item, type, dismissedItems) {
    const card = document.createElement('div');
    const isMrp = type === 'mrp';
    const isDismissed = (dismissedItems[type] || []).includes(item.id);
    card.className = isMrp ? 'mrp-card' : 'intervention-card';
    card.dataset.itemData = JSON.stringify(item);
    card.dataset.itemType = type;
    if (isDismissed) {
        card.classList.add('archived');
        delete card.dataset.priority;
        delete card.dataset.severity;
    } else {
        if (isMrp) card.dataset.severity = item.severity_color.toLowerCase();
        else card.dataset.priority = item.priority_color.toLowerCase();
    }
    const summary = isMrp ? item.problem_summary : item.intervention_summary;
    const analysis = isMrp ? item.analysis_summary : '';
    const dismissSymbol = isDismissed ? '↺' : '×';
    const dismissTitle = isDismissed ? 'Restore this item' : 'Dismiss this item';
    card.innerHTML = `<button class="dismiss-btn" title="${dismissTitle}">${dismissSymbol}</button><div class="card-content-wrapper"><h4>${summary}</h4>${analysis ? `<p>${analysis}</p>` : ''}</div>`;
    return card;
}

export function renderSummary(summary, summaryGrid) {
    summaryGrid.innerHTML = '';
    if (!summary) return;
    const summaryData = [
        { title: 'Medication Used', content: summary.medications_used },
        { title: 'Relevant Problems', content: summary.problems_used },
        { title: 'Lab Data Used', content: summary.lab_data_used },
        { title: 'Vitals Used', content: summary.vitals_used },
    ];
    summaryData.forEach(item => {
        const box = document.createElement('div');
        box.className = 'summary-box';
        box.innerHTML = `<h4>${item.title}</h4><p>${(item.content || 'N/A').replace(/, /g, '<br>')}</p>`;
        summaryGrid.appendChild(box);
    });
}

export function renderScore(scoreData, { scoreText, scoreCircle, scoreRationale }) {
    if (!scoreData) return;
    const score = scoreData.score || 0;
    scoreText.textContent = `${score}%`;
    scoreRationale.textContent = scoreData.rationale || 'No rationale provided.';
    const circumference = 2 * Math.PI * 15.9155;
    scoreCircle.style.strokeDasharray = `${circumference}, ${circumference}`;
    setTimeout(() => {
        const offset = circumference - (score / 100) * circumference;
        scoreCircle.style.strokeDasharray = `${circumference - offset}, ${circumference}`;
    }, 100);
    if (score < 40) scoreCircle.style.stroke = 'var(--severity-red)';
    else if (score < 70) scoreCircle.style.stroke = 'var(--severity-orange)';
    else scoreCircle.style.stroke = 'var(--severity-green)';
}

export function renderAllResults(reviewData, dismissedItems, grids) {
    const { mrpGrid, interventionsGrid, archivedMrpGrid, archivedInterventionsGrid, mrpCountSpan } = grids;
    const aiData = reviewData.aiResponse;
    [mrpGrid, interventionsGrid, archivedMrpGrid, archivedInterventionsGrid].forEach(grid => grid.innerHTML = '');
    const allMrps = aiData.mrps || [];
    const allInterventions = aiData.broader_interventions || [];
    const activeMrps = allMrps.filter(m => !(dismissedItems.mrp || []).includes(m.id));
    const archivedMrps = allMrps.filter(m => (dismissedItems.mrp || []).includes(m.id));
    const activeInterventions = allInterventions.filter(i => !(dismissedItems.interventions || []).includes(i.id));
    const archivedInterventions = allInterventions.filter(i => (dismissedItems.interventions || []).includes(i.id));
    mrpCountSpan.textContent = activeMrps.length;
    activeMrps.length > 0 ? activeMrps.forEach(mrp => mrpGrid.appendChild(createCard(mrp, 'mrp', dismissedItems))) : mrpGrid.innerHTML = '<p class="placeholder-message">No active Medicine-Related Problems.</p>';
    activeInterventions.length > 0 ? activeInterventions.forEach(item => interventionsGrid.appendChild(createCard(item, 'intervention', dismissedItems))) : interventionsGrid.innerHTML = '<p class="placeholder-message">No active broader interventions.</p>';
    archivedMrps.forEach(mrp => archivedMrpGrid.appendChild(createCard(mrp, 'mrp', dismissedItems)));
    archivedInterventions.forEach(item => archivedInterventionsGrid.appendChild(createCard(item, 'intervention', dismissedItems)));
}

// --- THE FIX IS HERE ---
/**
 * Renders the drug-drug interaction matrix and summary list.
 * @param {object} interactionData - The `interactions` object from the AI response.
 * @param {HTMLElement} container - The main container element for interactions.
 */
export function renderInteractionMatrix(interactionData, container) {
    if (!interactionData || !interactionData.drugs || !interactionData.matrix) {
        container.innerHTML = '<p class="placeholder-message">Interaction data is not available or has not been generated.</p>';
        return;
    }

    const matrixTable = document.createElement('table');
    matrixTable.id = 'interaction-matrix';
    matrixTable.className = 'interaction-matrix';
    const crucialList = document.createElement('div');
    crucialList.id = 'crucial-interactions-list';
    crucialList.className = 'crucial-interactions-list';
    const wrapper = document.createElement('div');
    wrapper.className = 'interaction-matrix-wrapper';
    wrapper.appendChild(matrixTable);
    
    container.innerHTML = ''; // Clear previous content
    container.appendChild(wrapper);
    container.appendChild(crucialList);

    const { drugs, matrix, crucial_interactions } = interactionData;

    // Build table header
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = '<th> </th>';
    drugs.forEach(drug => {
        headerRow.innerHTML += `<th class="header-cell">${drug}</th>`;
    });
    matrixTable.appendChild(headerRow);

    // Build table rows
    drugs.forEach((rowDrug, rowIndex) => {
        const row = document.createElement('tr');
        row.innerHTML = `<th>${rowDrug}</th>`;
        drugs.forEach((colDrug, colIndex) => {
            if (colIndex <= rowIndex) {
                row.innerHTML += '<td> </td>';
            } else {
                const interaction = matrix[rowDrug] ? matrix[rowDrug][colDrug] : null;
                let cellContent = '-';
                if (interaction) {
                    const iconClass = interaction.compatible ? 'icon-compatible' : 'icon-incompatible';
                    const icon = interaction.compatible ? '✓' : '×';
                    cellContent = `<span class="${iconClass}">${icon}</span><span class="tooltip">${interaction.explanation}</span>`;
                }
                row.innerHTML += `<td class="interaction-cell">${cellContent}</td>`;
            }
        });
        matrixTable.appendChild(row);
    });

    // Render crucial interactions
    (crucial_interactions || []).forEach(item => {
        const bar = document.createElement('div');
        bar.className = 'crucial-interaction-bar';
        bar.innerHTML = `<strong>${item.drugs.join(' + ')}:</strong> ${item.summary}`;
        crucialList.appendChild(bar);
    });
}