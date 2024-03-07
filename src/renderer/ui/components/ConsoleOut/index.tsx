import React from 'react';
import clsx from 'clsx';
import styles from './index.module.css';
export type ConsoleOutMessage = {
  type: 'info' | 'error' | 'warn'
  message: string
}
export type ConsoleOutProps = {
  messages: ConsoleOutMessage[]
  style?: React.CSSProperties
  className?: string
}

const ConsoleOut = (
  {
    messages,
    style,
    className
  }: ConsoleOutProps) => {
  const getTypeColor = (type: ConsoleOutMessage['type']) => {
    switch (type) {
      case 'error':
        return 'rgb(255,44,44)';
      case 'warn':
        return 'yellow';
      case 'info':
      default:
        return 'white';
    }
  }
  return (
    <div
      style={{
        ...style,
      }}
      className={clsx(className,styles.messageContainer)}
    >
      {
        messages.reverse().map((message, index) => (
          <pre
            className={styles.line}
            key={index}
               style={{
            color: getTypeColor(message.type)
          }}>
            {message.message}
          </pre>
        ))
      }
    </div>
  );
};
export default ConsoleOut;
