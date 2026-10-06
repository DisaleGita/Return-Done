import React from 'react'

function StoreComponent(props: any) {
  return (
    <>
        <div className="form-group" key={props.key}>
                        <label>Store Name</label>
                        <input
                        type="text"
                            {...props.register('storeName')}
                            className={`form-control ${props.errors.storeName ? 'is-invalid' : ''}`}
                        />
                        <div className="invalid-feedback">{props.errors.storeName?.message}</div>
                    </div>
        </>
  )
}

export default StoreComponent;