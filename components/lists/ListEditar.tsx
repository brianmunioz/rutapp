import IcontactosSQL from '@/interfaces/IContactosSQL';
import React, {  useEffect, useState } from 'react'
import { View, ScrollView, Linking } from "react-native";
import { ActivityIndicator, Button, Card, Dialog, Icon, IconButton, Portal, Searchbar, Text } from 'react-native-paper';
import EditarContacto from '../Acciones/EditarContacto';

interface IProps {
  datos: IcontactosSQL[],
  eliminar:(e:string)=>void,
  verUbicacion: (lat:number,lng:number)=>void,
  pedirContactos: ()=>void
}

const ListEditar: React.FC<IProps> = ({ datos,eliminar, verUbicacion,pedirContactos }) => {
  const [eliminarModal, setEliminarModal] = useState({ bool: false, id: "", nombre: "" });
  const [search, setSearch] = useState("");
  const [eliminando, setEliminando] = useState(false);
  const [eliminado, setEliminado] = useState(false);
  const [editarContacto, setEditarContacto] = useState({bool:false, index:0})

  const [contactos, setContactos] = useState(datos)
  const buscar = (e: string) => {
    setSearch(e);
    if (e.trim()) {
      const busqueda = datos.filter(con => con.nombre.toLocaleLowerCase().trim().includes(e.toLocaleLowerCase().trim()) || con.direccion.toLocaleLowerCase().trim().includes(e.toLocaleLowerCase().trim()) || con.tipo.toLocaleLowerCase().trim().includes(e.toLocaleLowerCase().trim()) || con.notas.toLocaleLowerCase().trim().includes(e.toLocaleLowerCase().trim()));
      setContactos(busqueda)
    }else{
      setContactos(datos)
    }
  }
  useEffect(()=>{
    setContactos(datos)
  },[editarContacto.bool])
  if (!editarContacto.bool){
  return (
    <ScrollView style={{ width: "100%", flex: 1, paddingHorizontal: 10, paddingTop: 10, backgroundColor: "white" }}>

      <View style={{ flexDirection: "column", gap: 10, paddingBottom:20,justifyContent: "center", alignItems: "center", width: "100%" }} >
        <Searchbar
          placeholder="Search"
          onChangeText={(text) => buscar(text)}
          value={search}
        />
        {contactos.length >0 ? 
          contactos.map((e,index) => <Card key={e.id} style={{ width: "100%" }}>
            <Card.Title
              title={e.nombre}
              subtitle={e.direccion}
              left={(props) => <Icon {...props} color={e.tipo == "proveedor" ? "red" : "green"} source="map-marker" />}
              right={(props) => <IconButton {...props} icon="delete" onPress={() => setEliminarModal({ bool: !eliminarModal.bool, id: e.id.toString(), nombre: e.nombre })} />}
            />
            <Card.Actions>
            <Button mode="outlined" disabled={e.telefono == null ? true : false}    onPress={() =>  Linking.openURL(`http://api.whatsapp.com/send?phone=${e.telefono}`)}><Icon color={e.telefono == null ? 'grey': ''}  source={'whatsapp'} size={20}></Icon> </Button>
            <Button mode="outlined"  disabled={e.telefono == null? true : false}   onPress={() =>  Linking.openURL(`tel:+${e.telefono}`)}> <Icon color={e.telefono == null ? 'grey': ''} source={'phone'} size={20}></Icon> </Button>
              <Button mode='outlined' onPress={() => verUbicacion(e.lat,e.lng)}>
                <Icon  source="eye" size={20} />
              </Button>
              <Button mode='outlined' onPress={()=>setEditarContacto({bool:true, index: index})}>
                <Icon  source="pencil" size={20}  />
              </Button>
            </Card.Actions>
          </Card>
          ):
          <Text>No tiene contactos guardados</Text>
        }
      </View>
      <Portal>
        <Dialog visible={eliminarModal.bool} onDismiss={() => setEliminarModal({ ...eliminarModal, bool: !eliminarModal.bool })}>
          <Dialog.Title>{eliminando ? "Eliminando...": "Eliminar contacto"}</Dialog.Title>
          <Dialog.Content>
            {eliminando  && <ActivityIndicator/> }
            { !eliminando && !eliminado && <Text variant="bodyMedium">Está seguro que desea eliminar {eliminarModal.nombre}? </Text>}
            {eliminado && <Text variant="bodyMedium"> {eliminarModal.nombre} se eliminó de tus registros de contacto </Text>}
          </Dialog.Content>
          <Dialog.Actions>
            {!eliminando && 
            <Button textColor='black' onPress={() => {
              setEliminado(false);
              setEliminarModal({ ...eliminarModal, bool: !eliminarModal.bool })}}>{eliminado ? "OK": "cancelar"}</Button>
            }
            
            {!eliminado && !eliminando&& 
             <Button textColor='red' onPress={async()=>{
               eliminar(eliminarModal.id)
              setSearch("");
              
              setEliminando(true);

              setTimeout(()=>{
                setEliminando(false);
                setEliminado(true)
                setContactos(datos.filter(e=>e.id.toString() != eliminarModal.id));
              },2000)
              }}>Eliminar</Button>
          }
           
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>

  )} else {
    return <EditarContacto pedirContactos={()=>pedirContactos()} setModalVisible={(e)=>setEditarContacto({bool:e,index:0})} datos={datos[editarContacto.index]}/>
  }
}

export default ListEditar