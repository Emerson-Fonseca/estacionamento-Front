
function atualizarVaga(id, ocupada) {
    const bolinha = document.getElementById(`vaga-${id}`);

    if (!bolinha) {
        console.warn(`Vaga ${id} não encontrada no HTML.`);
        return;
    }

    bolinha.classList.remove(
        "livre",
        "ocupada",
        "indisponivel"
    );

    bolinha.classList.add(ocupada ? "ocupada" : "livre");
}

const botao = document.getElementById("conectarArduino");
const statusArduino = document.getElementById("statusArduino");

async function conectarArduino() {

    // verifica comunicaçao
    if (!("serial" in navigator)) {
        statusArduino.textContent =
            "Use Google Chrome ou Microsoft Edge.";
        return;
    }

    let leitor;

    try {
        // pede acesso
        const porta = await navigator.serial.requestPort();

        // busca a conexao
        await porta.open({ baudRate: 9600 });

        statusArduino.textContent = "Arduino conectado!";

        // prepara a leitura
        const decoder = new TextDecoderStream();

        const encerramento = porta.readable.pipeTo(decoder.writable);

        leitor = decoder.readable.getReader();

        let buffer = "";

        while (true) {
            const { value, done } = await leitor.read();

            if (done) break;

            buffer += value;

            const linhas = buffer.split("\n");
            buffer = linhas.pop();

            for (const linha of linhas) {

                const mensagem = linha.trim();

                if (mensagem === "0") {
                    atualizarVaga(1, false);
                    statusArduino.textContent = "Vaga 1 livre!";

                } else if (mensagem === "1") {
                    atualizarVaga(1, true);
                    statusArduino.textContent = "Vaga 1 ocupada!";
                }

                }
        }

        await encerramento;

    } catch (erro) {
        console.error("Erro completo:", erro);

        statusArduino.textContent =
            `Erro: ${erro.name} - ${erro.message}`;

    } finally {
        if (leitor) {
            try {
                await leitor.cancel();
                leitor.releaseLock();
            } catch (erro) {
                console.log("Leitor encerrado.");
            }
        }
    }
}

if (botao) {
    botao.addEventListener("click", conectarArduino);
} else {
    console.error("Botão conectarArduino não encontrado no HTML.");
}
