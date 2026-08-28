import { FakeEmailProvider } from './fake-email.provider';

const message = {
  to: 'persona@example.test',
  subject: 'Asunto seguro',
  html: '<p>Contenido</p>',
  text: 'Contenido',
};

describe('FakeEmailProvider', () => {
  it('captures sent messages without network access', async () => {
    const provider = new FakeEmailProvider();

    await expect(provider.send(message)).resolves.toEqual({
      messageId: 'fake-1',
      accepted: true,
    });
    expect(provider.getMessages()).toEqual([message]);
  });

  it('clears captured messages', async () => {
    const provider = new FakeEmailProvider();
    await provider.send(message);

    provider.clear();

    expect(provider.getMessages()).toEqual([]);
  });

  it('simulates and clears a controlled failure', async () => {
    const provider = new FakeEmailProvider();
    provider.simulateFailure(new Error('controlled'));

    await expect(provider.send(message)).rejects.toThrow('controlled');
    expect(provider.getMessages()).toEqual([]);

    provider.clearFailure();
    await expect(provider.send(message)).resolves.toMatchObject({
      accepted: true,
    });
  });

  it('rejects subjects containing CR or LF', async () => {
    const provider = new FakeEmailProvider();

    await expect(
      provider.send({ ...message, subject: 'Unsafe\r\nBcc: x' }),
    ).rejects.toThrow('CR or LF');
  });
});
