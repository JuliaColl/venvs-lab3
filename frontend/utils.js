const str = () => ('00000000000000000' + (Math.random() * 0xffffffffffffffff).toString(16)).slice(-16);

export const uuid = () => {
  const a = str();
  const b = str();
  return a.slice(0, 8) + '-' + a.slice(8, 12) + '-4' + a.slice(13) + '-a' + b.slice(1, 4) + '-' + b.slice(4);
};

export const randomHex = () => "#000000".replace(/0/g,function(){return (~~(Math.random()*16)).toString(16);});
export const colorHash = (src) => {
    const stringUniqueHash = [...src].reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    return `hsl(${stringUniqueHash % 360}, 50%, 35%)`;
}

export const clamp = ( v, min, max) => {
    return (v < min ? min : (v > max ? max : v))
}

export const lerp = (a, b, f) => {
    return a*(1-f) + b * f;
}

export const htmlToElement = (html) => {
    // src: https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro/35385518#35385518
    var template = document.createElement('template');
    html = html.trim();
    template.innerHTML = html;
    return template.content.firstChild;
}