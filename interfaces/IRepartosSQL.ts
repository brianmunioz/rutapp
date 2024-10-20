import IcontactosSQL from "./IContactosSQL";

export default interface IRepartosSQL extends IcontactosSQL{
    estado:boolean,
    fecha:Date,
    IDContactos:number,
    descripcion: string

}