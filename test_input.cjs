const axios = require('axios');

async function testCustomInput() {
    try {
        const response = await axios.post('http://localhost:5000/api/compiler/execute', {
            language: 'python',
            code: 'x = input(); print(f"Hello {x}")',
            input: 'World'
        });
        console.log('Output:', response.data.output);
        if (response.data.output.trim() === 'Hello World') {
            console.log('SUCCESS: Custom Input works!');
        } else {
            console.log('FAILURE: Output mismatch');
        }
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

testCustomInput();
