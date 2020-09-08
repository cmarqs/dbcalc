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
}

function calcIndexes(text) {
    let regex = /(\({1}[^ \(])(.+)(\){1}[^ \(])/g; //captura os indices
    let words = [...text.matchAll(regex)];
}

/*
 * Padroniza o volume em kb, mb ou gb em bytes (para a mesma base da lógica de tabela vazia)
 */
function standardVolumeInBytes(volume, medida) {
    //se for passado 0 kb/mb/gb, considero 1byte
    if (volume == 0)
        return 0;

    switch (medida) {
        case 'KB':
            return volume * 1000 //1kb = 1000bytes
        case 'MB':
            return volume * 1000000 //1mb = 1e+6bytes
        case 'GB':
            return volume * 1000000000 //1gb = 1e+9bytes
    }
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
    let volBytes = standardVolumeInBytes(volume, medida);
    let outP1, outP2;
    let valPeriodMonth, valPeriodYear = 0;

    if (periodoIn == 'Day') {
        valPeriodMonth = 30.41 //media de dias por mês
        valPeriodYear = 365; //dias por ano
    } else {
        valPeriodMonth = 1; //meses por mes
        valPeriodYear = 12 //meses por ano
    }

    /*Se não for informada a quantidade de linhas previstas, repito o total do banco vazio*/
    if (volBytes == 0) {
        outP1 = (totalBytesFields + totalBytesIndex);
        outP2 = outP1;
    } else {
        outP1 = (totalBytesFields + totalBytesIndex) * volBytes * valPeriodMonth; // volumn by month in bytes
        outP2 = (totalBytesFields + totalBytesIndex) * volBytes * valPeriodYear; // volumn by year in bytes
    }

    console.log(`${periodoIn}: outP1 = (${totalBytesFields} + ${totalBytesIndex}) * ${volBytes} * ${valPeriodMonth} = ${outP1}`)
    console.log(`${periodoIn}: outP2 = (${totalBytesFields} + ${totalBytesIndex}) * ${volBytes} * ${valPeriodYear} = ${outP2}`)

    let totalKbEmpty = totalBytesFields / 1000; //kb
    let totalMb = outP1 / 1e+6;
    let totalGb = outP2 / 1e+9;

    // console.log(totalMb)

    document.querySelector('span#resBytes').textContent = `${totalKbEmpty} KB`
    document.querySelector('span#thBytes').textContent = 'Tabela vazia';
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