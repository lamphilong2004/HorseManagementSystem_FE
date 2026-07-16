const fs = require('fs');
const data = fs.readFileSync('src/swagger-init.js', 'utf16le');
let optionsMatch = data.match(/let options = ({.*});/s);
if (!optionsMatch) {
    optionsMatch = data.match(/var options = ({.*});/s);
}
if (!optionsMatch) {
    optionsMatch = data.match(/const options = ({.*});/s);
}
if (optionsMatch) {
    try {
        // Since options might contain unquoted keys or JS specific things, it's safer to use eval
        let options;
        eval('options = ' + optionsMatch[1]);
        if (options && options.swaggerDoc && options.swaggerDoc.paths) {
            console.log(Object.keys(options.swaggerDoc.paths).join('\n'));
        } else {
            console.log('No swaggerDoc paths found');
        }
    } catch(e) {
        console.error('Eval error', e);
    }
} else {
    console.log('No options found in file');
}
