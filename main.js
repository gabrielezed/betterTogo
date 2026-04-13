const userInterface = {
    searchInput: document.getElementById('searchInput'),
    modeSelect: document.getElementById('modeSelect'),
    alphabetNav: document.getElementById('alphabetNav'),
    tableBody: document.getElementById('tableBody'),
    errorMessage: document.getElementById('errorMessage'),
    prevButton: document.getElementById('prevButton'),
    nextButton: document.getElementById('nextButton'),
    pageIndicator: document.getElementById('pageIndicator'),
    columnHeaderPrimary: document.getElementById('columnHeaderPrimary'),
    columnHeaderSecondary: document.getElementById('columnHeaderSecondary')
};

let databaseInstance = null;

const applicationState = {
    searchTerm: '',
    startingLetter: null,
    mode: 'it-sa',
    pageIndex: 0,
    itemsPerPage: 50,
    totalPages: 0
};

async function initializeApplication() {
    try {
        const sqlPromise = initSqlJs({
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        });

        const dataPromise = fetch('togo.db').then(response => {
            if (!response.ok) {
                throw new Error('Database file not found');
            }
            return response.arrayBuffer();
        });

        const [SQL, buffer] = await Promise.all([sqlPromise, dataPromise]);

        databaseInstance = new SQL.Database(new Uint8Array(buffer));

        buildAlphabetNavigation();
        bindEventListeners();
        executeDataRetrieval();

    } catch (error) {
        displayError('System failure: Unable to load togo.db. Ensure the database file is accessible.');
    }
}

function buildAlphabetNavigation() {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    const allButton = document.createElement('button');
    allButton.textContent = 'ALL';
    allButton.classList.add('active');
    allButton.addEventListener('click', () => handleLetterSelection(null, allButton));
    userInterface.alphabetNav.appendChild(allButton);

    for (const character of alphabet) {
        const button = document.createElement('button');
        button.textContent = character;
        button.addEventListener('click', () => handleLetterSelection(character, button));
        userInterface.alphabetNav.appendChild(button);
    }
}

function bindEventListeners() {
    userInterface.searchInput.addEventListener('input', handleSearchInput);
    userInterface.modeSelect.addEventListener('change', handleModeChange);
    userInterface.prevButton.addEventListener('click', handlePreviousPage);
    userInterface.nextButton.addEventListener('click', handleNextPage);
}

function handleSearchInput(event) {
    applicationState.searchTerm = event.target.value.trim();
    applicationState.pageIndex = 0;
    executeDataRetrieval();
}

function handleModeChange(event) {
    applicationState.mode = event.target.value;
    applicationState.pageIndex = 0;

    if (applicationState.mode === 'it-sa') {
        userInterface.columnHeaderPrimary.textContent = 'Italian';
        userInterface.columnHeaderSecondary.textContent = 'Sassarese';
    } else {
        userInterface.columnHeaderPrimary.textContent = 'Sassarese';
        userInterface.columnHeaderSecondary.textContent = 'Italian';
    }

    executeDataRetrieval();
}

function handleLetterSelection(letter, clickedButton) {
    applicationState.startingLetter = letter;
    applicationState.pageIndex = 0;

    const allButtons = userInterface.alphabetNav.querySelectorAll('button');
    for (const btn of allButtons) {
        btn.classList.remove('active');
    }
    clickedButton.classList.add('active');

    executeDataRetrieval();
}

function handlePreviousPage() {
    if (applicationState.pageIndex > 0) {
        applicationState.pageIndex--;
        executeDataRetrieval();
        window.scrollTo(0, 0);
    }
}

function handleNextPage() {
    if (applicationState.pageIndex < applicationState.totalPages - 1) {
        applicationState.pageIndex++;
        executeDataRetrieval();
        window.scrollTo(0, 0);
    }
}

function executeDataRetrieval() {
    if (!databaseInstance) return;

    try {
        let baseQueryConditions = " WHERE 1=1";
        let queryParameters = [];

        if (applicationState.searchTerm !== '') {
            baseQueryConditions += " AND (italian LIKE ? OR sassarese LIKE ?)";
            const wildCardTerm = `%${applicationState.searchTerm}%`;
            queryParameters.push(wildCardTerm, wildCardTerm);
        }

        if (applicationState.startingLetter !== null) {
            const targetColumn = applicationState.mode === 'it-sa' ? 'italian' : 'sassarese';
            baseQueryConditions += ` AND ${targetColumn} LIKE ?`;
            queryParameters.push(`${applicationState.startingLetter}%`);
        }

        const countQueryString = `SELECT COUNT(*) as total FROM dictionary${baseQueryConditions}`;
        const countStatement = databaseInstance.prepare(countQueryString);
        countStatement.bind(queryParameters);
        countStatement.step();
        const totalItemsCount = countStatement.getAsObject().total;
        countStatement.free();

        applicationState.totalPages = Math.ceil(totalItemsCount / applicationState.itemsPerPage);

        const sortingColumn = applicationState.mode === 'it-sa' ? 'italian' : 'sassarese';
        const dataQueryString = `SELECT italian, sassarese, pronunciation FROM dictionary${baseQueryConditions} ORDER BY ${sortingColumn} COLLATE NOCASE ASC LIMIT ? OFFSET ?`;

        const offsetValue = applicationState.pageIndex * applicationState.itemsPerPage;
        const dataParameters = [...queryParameters, applicationState.itemsPerPage, offsetValue];

        const dataStatement = databaseInstance.prepare(dataQueryString);
        dataStatement.bind(dataParameters);

        userInterface.tableBody.innerHTML = '';

        while (dataStatement.step()) {
            appendRowToTable(dataStatement.getAsObject());
        }

        dataStatement.free();

        updatePaginationInterface();

    } catch (error) {
        console.error(error);
        displayError('Data processing failure: Unable to execute database query.');
    }
}

function appendRowToTable(rowData) {
    const tableRow = document.createElement('tr');

    const primaryCell = document.createElement('td');
    const secondaryCell = document.createElement('td');
    const pronunciationCell = document.createElement('td');

    if (applicationState.mode === 'it-sa') {
        primaryCell.textContent = rowData.italian || '-';
        secondaryCell.textContent = rowData.sassarese || '-';
    } else {
        primaryCell.textContent = rowData.sassarese || '-';
        secondaryCell.textContent = rowData.italian || '-';
    }

    pronunciationCell.textContent = rowData.pronunciation || '-';

    tableRow.appendChild(primaryCell);
    tableRow.appendChild(secondaryCell);
    tableRow.appendChild(pronunciationCell);

    userInterface.tableBody.appendChild(tableRow);
}

function updatePaginationInterface() {
    userInterface.pageIndicator.textContent = `Page ${applicationState.pageIndex + 1} of ${applicationState.totalPages || 1}`;
    userInterface.prevButton.disabled = applicationState.pageIndex === 0;
    userInterface.nextButton.disabled = applicationState.pageIndex >= applicationState.totalPages - 1 || applicationState.totalPages === 0;
}

function displayError(message) {
    userInterface.errorMessage.textContent = message;
    userInterface.errorMessage.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', initializeApplication);
