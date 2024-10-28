export default  function verificarTexto(texto:string):boolean{
    const regex = /^[\d\wÁÉÍÓÚáéíóúÑñüÜ.,\-\s!?¿¡:;"'()$%]+$/;
    return regex.test(texto);
}
