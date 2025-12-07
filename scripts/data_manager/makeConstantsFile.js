const prettier = require("prettier/standalone");
const pluginBabel = require("prettier/plugins/babel.js");
const pluginEstree = require("prettier/plugins/estree.js");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const file = XLSX.readFile(`./import/game_data.xlsx`);

const makeConstantsFile = async () => {

    const sheet = file.Sheets["constants"];

    const keys = Object.keys(sheet);
    const values = Object.values(sheet).filter((cellInfo, index) => keys[index].charCodeAt(0) < String("C").charCodeAt(0))
        .map(e => e.v);

    const constants = [];

    let constName = "";
    for (let i = 0; i < values.length; i++) {
        const value = values[i];

        if (typeof value === "string" && value.includes("_")) continue;
        if (value === "id") {
            constName = values[i - 1].toUpperCase();
            // const zero_index = values.slice(i, values.length).findIndex(v => v === 0);
            constants.push({
                name: constName,
                values: {}
            });
            i++;
        } else if (value !== undefined) {
            const target = constants.find(e => e.name === constName);
            target.values[Number(values[i])] = values[i++ + 1];
        }
    }

    let txt = ``;
    for (let i = 0; i < constants.length; i++) {
        const constant = constants[i];
        txt += `const ${constant.name} = ${JSON.stringify(constant.values)}\n\n`;
    }

    const names = [...constants.values()].map(e => e.name);
    for (let i = 0; i < names.length; i++) {
        txt += `Object.freeze(${names[i]});`;
    }
    txt += `\n\nmodule.exports = {${names.join(",")}}`;
    txt = await prettier.format(txt, {
        parser: "babel",
        plugins: [pluginBabel, pluginEstree]
    })

    const constFilePath = path.join(__dirname, "constants.js");
    const isExist = fs.existsSync(constFilePath);

    if (isExist) {
        fs.unlinkSync(constFilePath);
    }

    // console.log(txt);

    fs.writeFileSync(constFilePath, txt);
}

makeConstantsFile();