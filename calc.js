function getMatch(queryCreateTable) {

    function calcFields(field) {
        let fieldStr = field.toLowerCase().match(/\w+/g);
        let fieldLen = isNaN(fieldStr[1]) ? 1 : Number.parseInt(fieldStr[1]);
        let value = 0;
        switch (fieldStr[0]) {
            case 'tinyint':
                value = 1;
                break;
            case 'smallint':
                value = 2;
                break;
            case 'mediumint':
                value = 3;
                break;
            case 'int':
                value = 4;
                break;
            case 'integer':
                value = 4;
                break;
            case 'bigint':
                value = 8;
                break;
            case 'float':
                value = 4;
                break;
            case 'float':
                value = (fieldLen > 24 ? 8 : 4);
                break;
            case 'double':
                value = 8;
                break;
            case 'real':
                value = 8;
                break;
            case 'bit':
                value = 8;
                break;
            case 'decimal':
                value = 4;
                break;
            case 'year':
                value = 1;
                break;
            case 'date':
                value = 3;
                break;
            case 'time':
                value = 3;
                break;
            case 'datetime':
                value = 8;
                break;
            case 'timestamp':
                value = 4;
                break;
            case 'char':
                value = 3 * (fieldLen ? 8 : 4);;
                break;
            case 'binary':
                value = fieldLen;
                break;
            case 'varchar':
                value = fieldLen + 2;
                break;
            case 'varbinary':
                value = fieldLen + 2;
                break;
            case 'tinyblob':
                value = fieldLen + 1;
                break;
            case 'tinytext':
                value = fieldLen + 1;
                break;
            case 'blob':
                value = fieldLen + 2;
                break;
            case 'text':
                value = fieldLen + 2;
                break;
            case 'mediumblob':
                value = fieldLen + 3;
                break;
            case 'mediumtext':
                value = fieldLen + 3;
                break;
            case 'longblob':
                value = fieldLen + 4;
                break;
            case 'longtext':
                value = fieldLen + 4;
                break;
            case 'json':
                value = fieldLen + 10;
                break;
            default:
                value = 0;
                break;
        }
        return value;
    }

    let regex = /( )((\w+\(\d+\))|((medium|tiny|long)?text)|(datetime|timestamp|date)|(\w+\(\d+\,\d+\)))( |,)/g;
    let words = [...queryCreateTable.matchAll(regex)];

    let totalBytes = 0;
    let totalFields = 0;

    Array.from(words, function campos(res) {
        totalBytes += calcFields(res[2]);
    })

    return totalBytes;
    // calcAll(totalBytes, 0, document.querySelector('#txtDataVolume').value, 'day')

    // document.querySelector('span#resFields').textContent = words.length;
    // document.querySelector('span#resBytes').textContent = totalBytes;
}

function calcIndexes(text) {
    let regex = /(\({1}[^ \(])(.+)(\){1}[^ \(])/g; //captura os indices
    let words = [...text.matchAll(regex)];
}

function standardVolumeInKb(volume, medida) {
    switch (medida) {
        case 'KB':
            volume = (volume == 0 ? 1 : volume)
            break;
        case 'MB':
            volume = (volume == 0 ? 0.001 : volume / 1000)
            break;
        case 'GB':
            volume = (volume == 0 ? 0.000001 : volume / 1e+6)
            break;
        default:
            volume = 1;
            break;
    }
    return volume;
}

/*
    Calcula os valores de acordo com as entradas no formulário. 
    Se for selecionado "day" no periodo, exibo o volume total em mês e ano.
    Se for selecionado "mês", exibo o volume total em dia e ano.

    totalytesFields = soma de bytes de acordo com as colunas passado no CREATE TABLE
    totalBytesIndex = soma de bytes dos índices do CREATE
    amountData = volume de dados previsto (ou existente) no período apontado no formulário (name=period)
    periodoIn = periodo selecionado no formulário (name=period)
*/
function showCalcs(totalBytesFields = 0, totalBytesIndex = 0, volume = 0, medida = 'KB', periodoIn = 'Day') {

    //padroniza o volume em kb
    let volKb = standardVolumeInKb(volume, medida);
    let outP1, outP2;
    if (periodoIn == 'Day') {
        outP1 = (totalBytesFields + totalBytesIndex) * volKb * 30.41; // volumn by month in kb
        outP2 = (totalBytesFields + totalBytesIndex) * volKb * 365; // volumn by year in kb

        document.querySelector('span#rsPeriod1').textContent = 'Month';
    } else {
        outP1 = (totalBytesFields + totalBytesIndex) * volKb / 30.41; // volumn by day
        outP2 = (totalBytesFields + totalBytesIndex) * volKb * 12; // volumn by year

        document.querySelector('span#rsPeriod1').textContent = 'Day';
    }
    document.querySelector('span#rsPeriod2').textContent = 'Year';

    let totalMb = outP1 / 1024;
    let totalGb = outP2 / 1e+6;

    // console.log(totalMb)

    document.querySelector('span#resBytes').textContent = `${totalBytesFields} KB`
    document.querySelector('span#thBytes').textContent = 'Qtd Bytes';
    document.querySelector('span#rsAmount1').textContent = `${parseFloat(totalMb).toFixed(2)} MB`;
    document.querySelector('span#rsAmount2').textContent = `${parseFloat(totalGb).toFixed(2)} GB`;

}

const formSerialize = formElement => {
    const values = {};
    const inputs = formElement.elements;

    for (let i = 0; i < inputs.length; i++) {
        if (inputs[i].type.toString() == 'radio') {
            if (inputs[i].checked)
                values[inputs[i].name] = inputs[i].value;
        } else
            values[inputs[i].name] = inputs[i].value;

    }
    return values;
}

const getDataFromForm = form => (evt) => {
    evt.preventDefault();
    const frmData = formSerialize(form);
    let query = frmData.queryInput;
    let volume = frmData.txtDataVolume;
    let medida = frmData.selMeasure;
    let periodo = frmData.rbPeriod;

    let bytesFromQuery = getMatch(query);
    console.log(`Bytes from query: ${bytesFromQuery}\n`);
    showCalcs(bytesFromQuery, 0, volume, medida, periodo)
}

// Função para lidar com eventos após o load
function load(evt) {
    const form = document.querySelector('#frmCalc');
    form.addEventListener('submit', getDataFromForm(form), false);
}

document.addEventListener("DOMContentLoaded", load, false);