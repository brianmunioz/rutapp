import React, {  useEffect, useState } from 'react'
import { View, ScrollView } from "react-native";
import { ActivityIndicator, Button, Card, Dialog, Icon, IconButton, Portal, Searchbar, Text } from 'react-native-paper';
import IRepartosSQL from '@/interfaces/IRepartosSQL';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EditarReparto from '../Acciones/EditarReparto';

interface IProps {
  datos: IRepartosSQL[],
  eliminar:(e:string)=>void,
  verUbicacion: (lat:number,lng:number)=>void,
  pedirContactos: ()=>void
}

const ListEditarReparto: React.FC<IProps> = ({ datos,eliminar, verUbicacion,pedirContactos }) => {
  const [eliminarModal, setEliminarModal] = useState({ bool: false, id: "", nombre: "" });
  const [eliminando, setEliminando] = useState(false);
  const [eliminado, setEliminado] = useState(false);
  const [editarContacto, setEditarContacto] = useState({bool:false, index:0})

  const [contactos, setContactos] = useState(datos)
  useEffect(()=>{
    async function cambiarOrdenDeIndices(){
      const nuevosIndices = contactos.map(e=>e.id);
      await AsyncStorage.setItem('ordenrepartos',JSON.stringify(nuevosIndices)) 

    }
    cambiarOrdenDeIndices();
  },[contactos])

  useEffect(()=>{
    setContactos(datos)
  },[editarContacto.bool])
  if (!editarContacto.bool){
  return (
    <ScrollView style={{ width: "100%", flex: 1, paddingHorizontal: 10, paddingTop: 10, backgroundColor: "white" }}>

      <View style={{ flexDirection: "column", gap: 10, paddingBottom:20,justifyContent: "center", alignItems: "center", width: "100%" }} >
       
        {contactos.length >0 ? 
          contactos.map((e,index) => <Card key={e.id} style={{ width: "100%" }}>
            <Card.Title
              title={e.nombre}
              subtitle={e.direccion}
              left={(props) => <Icon {...props} color={e.tipo_contacto == "proveedor" ? "red" : "green"} source="map-marker" />}
              right={(props) => <IconButton {...props} icon="delete" onPress={() => setEliminarModal({ bool: !eliminarModal.bool, id: e.id.toString(), nombre: e.nombre })} />}
            />
             <Card.Content>
      <Text variant="bodyMedium">{e.descripcion ?e.descripcion :'Sin descripción de reparto'}</Text>
    </Card.Content>
            <Card.Actions>
            <Button mode="outlined" disabled={index == 0 ? true : false}    onPress={() =>{
             const swapWithNext = async (index: number) => {
              setContactos(arr => {
                  // Verifica que el índice está en rango y que no es el último elemento
                  if (index < 0 ) return arr;
          
                  const newArr = [...arr];
                  [newArr[index], newArr[index - 1]] = [newArr[index - 1], newArr[index]];
                  return newArr;
              });
              
          };
          swapWithNext(index);

            }}><Icon   source={'chevron-up'} size={20}></Icon> </Button>
            <Button mode="outlined"  disabled={index == (datos.length-1)? true : false}   onPress={() =>  {
               const swapWithNext = (index: number) => {
                setContactos(arr => {
                    // Verifica que el índice está en rango y que no es el último elemento
                    if (index < 0 || index >= arr.length - 1) return arr;
            
                    const newArr = [...arr];
                    [newArr[index], newArr[index + 1]] = [newArr[index + 1], newArr[index]];
            
                    return newArr;
                });
                
            };
            swapWithNext(index);
  
            }}> <Icon  source={'chevron-down'} size={20}></Icon> </Button>
              <Button mode='outlined' onPress={() => verUbicacion(e.lat,e.lng)}>
                <Icon  source="eye" size={20} />
              </Button>
              <Button mode='outlined' onPress={()=>setEditarContacto({bool:true, index: index})}>
                <Icon  source="pencil" size={20}  />
              </Button>
            </Card.Actions>
          </Card>
          ):
          <Text>No tiene repartos activos</Text>
        }
      </View>
      <Portal>
        <Dialog visible={eliminarModal.bool} onDismiss={() => setEliminarModal({ ...eliminarModal, bool: !eliminarModal.bool })}>
          <Dialog.Title>{eliminando ? "Eliminando...": "Eliminar reparto"}</Dialog.Title>
          <Dialog.Content>
            {eliminando  && <ActivityIndicator/> }
            { !eliminando && !eliminado && <Text variant="bodyMedium">¿Está seguro que desea eliminar el reparto nro. {eliminarModal.id}? </Text>}
            {eliminado && <Text variant="bodyMedium"> {eliminarModal.nombre} se eliminó de tus registros de repartos </Text>}
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
    return <EditarReparto pedirContactos={()=>pedirContactos()} setModalVisible={(e)=>setEditarContacto({bool:e,index:0})} datos={contactos[editarContacto.index]}/>
  }
}

export default ListEditarReparto