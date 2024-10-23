import IcontactosSQL from "./IContactosSQL";

export default interface IRepartosSQL extends IcontactosSQL{
    tipo_contacto: string,
    estado:boolean,
    fecha:Date,
    IDContactos:number,
    descripcion: string
}