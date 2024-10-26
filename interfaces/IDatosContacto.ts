export default interface IDatosContacto{
    nombre:string,
    tipo:string,
    lat:number,
    lng:number,
    telefono:string,
    nota:string,
    direccion: string,
    area?:string,
    descripcion?:string,
    IDContacto?:number|null
}