exports.autoEscapeRegExp = (string) => {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

const numerics = "0123456789";
exports.newNumber = size => {
	let randIdx = '';
	for (let len = 0; len < size; len++)
		randIdx += numerics[Math.floor(Math.random() * numerics.length)];

	return randIdx;
};