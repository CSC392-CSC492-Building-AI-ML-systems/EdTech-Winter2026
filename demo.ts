import * as readline from "readline";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

async function translateText(text: string): Promise<string> {
    const response = await fetch(`http://localhost:3000/translation?text=${encodeURIComponent(text)}`);

    const data = await response.json();
    return data.translatedText || "Translation failed";
}

function main(): void {
    rl.question("Enter text to translate to French: ", async (input) => {
        console.log("Translating to French...");
        const result = await translateText(input);
        console.log("French:", result);
        rl.close();
    });
}

main();