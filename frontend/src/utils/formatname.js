const formatName = (name = '') => {
    if (typeof name !== 'string') return '';

    return name
        .trim()
        .toLowerCase()
        .replace(/(^|[\s'-])([a-z])/g, (_, separator, letter) =>
            separator + letter.toUpperCase()
        );
};

export default formatName;