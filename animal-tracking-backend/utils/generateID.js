// Function to generate a unique animal ID like ST-1001
const generateAnimalID = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000); // Generates a 4-digit number
    return `ST-${randomNum}`;
};

module.exports = { generateAnimalID };