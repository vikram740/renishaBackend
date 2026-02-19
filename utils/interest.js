
function applyCompoundInterest(wallet, percentage, cycles) {
    let amount = Number(wallet) || 0;
    const rate = Number(percentage) || 0;

    for (let i = 0; i < cycles; i++) {
        amount += amount * (rate / 100);
    }

    return Number(amount.toFixed(2));
}

module.exports = {
    applyCompoundInterest
};
