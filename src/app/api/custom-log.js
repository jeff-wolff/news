export default function customLog(message, color) {
    const timestamp = new Date().toLocaleString();
    let colorCode;
  
    switch (color) {
      case "black":
        colorCode = "\x1b[30m";
        break;
      case "red":
        colorCode = "\x1b[31m";
        break;
      case "green":
        colorCode = "\x1b[32m";
        break;
      case "yellow":
        colorCode = "\x1b[33m";
        break;
      case "blue":
        colorCode = "\x1b[34m";
        break;
      case "magenta":
        colorCode = "\x1b[35m";
        break;
      case "cyan":
        colorCode = "\x1b[36m";
        break;
      case "white":
        colorCode = "\x1b[37m";
        break;
      default:
        colorCode = "";
    }
  
    console.log(`\x1b[0m[${timestamp}] ${colorCode}${message}\x1b[0m`);
}
  
